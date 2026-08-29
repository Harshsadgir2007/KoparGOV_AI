"""Firebase Firestore Database Service Layer for KoparGov AI.

Provides persistent storage for:
- Civic issues (`issues/{issue_id}`)
- CIE evaluation run bundles (`cie_results/{result_id}`)
- Officer workflow lifecycle states (`workflow/{issue_id}`)

Guarantees:
- Environment and configuration-driven initialization (Zero hardcoded secrets).
- Graceful offline/local mode: falls back to in-memory store when Firebase is unconfigured.
- Seamless serialization and deserialization with full model fidelity.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models.civic_issue import CivicIssue
from app.models.decision import CIEPipelineResponse
from app.models.workflow import WorkflowRecord

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


class DatabaseService:
    """Service managing Firestore data operations with graceful mock fallback."""

    def __init__(self, db_client=None, use_mock_if_missing: bool = True):
        """Initialize Firestore client or in-memory mock fallback.
        
        Args:
            db_client: Optional existing firestore client (useful for dependency injection/testing).
            use_mock_if_missing: If True, falls back to in-memory store if credentials are missing.
        """
        self._using_mock = False
        self._mock_db: Dict[str, Dict[str, Any]] = {
            "issues": {},
            "cie_results": {},
            "workflow": {},
        }

        if db_client is not None:
            self.client = db_client
        else:
            self.client = self._init_firestore(use_mock_if_missing)

    def _init_firestore(self, use_mock_if_missing: bool):
        """Initialize Firebase Admin SDK using environment variables or fall back to mock."""
        if not FIREBASE_AVAILABLE:
            if use_mock_if_missing:
                self._using_mock = True
                return None
            raise RuntimeError("firebase-admin package is not installed.")

        # Check if already initialized in app runtime
        if firebase_admin._apps:
            try:
                return firestore.client()
            except Exception:
                pass

        # Check for service account credentials file
        cred_path = settings.firebase_credentials_path or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        project_id = settings.firebase_project_id

        if cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                options = {"projectId": project_id} if project_id else {}
                firebase_admin.initialize_app(cred, options)
                return firestore.client()
            except Exception as e:
                if not use_mock_if_missing:
                    raise RuntimeError(f"Failed to initialize Firebase with credentials at '{cred_path}': {e}")

        # Check for project ID only / Google Application Default Credentials
        if project_id:
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {"projectId": project_id})
                return firestore.client()
            except Exception as e:
                if not use_mock_if_missing:
                    raise RuntimeError(f"Failed to initialize Firebase with project '{project_id}': {e}")

        # Fallback to in-memory mock store
        if use_mock_if_missing:
            self._using_mock = True
            return None
        else:
            raise RuntimeError("Firebase credentials not configured and fallback mode disabled.")

    @property
    def is_using_mock(self) -> bool:
        """Return whether the service is currently running in offline mock mode."""
        return self._using_mock

    # --------------------------------------------------------------------------
    # Civic Issue Persistence (Collection: 'issues')
    # --------------------------------------------------------------------------

    def save_issue(self, issue: CivicIssue) -> str:
        """Save or update a civic issue in Firestore.
        
        Args:
            issue: CivicIssue instance to persist.
            
        Returns:
            The issue ID.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        if not issue.created_at:
            issue.created_at = now_iso
        issue.updated_at = now_iso

        doc_data = issue.model_dump()

        if self._using_mock:
            self._mock_db["issues"][issue.id] = doc_data
        else:
            self.client.collection("issues").document(issue.id).set(doc_data)

        return issue.id

    def get_issue(self, issue_id: str) -> Optional[CivicIssue]:
        """Retrieve a civic issue by its unique ID.
        
        Args:
            issue_id: Unique issue identifier.
            
        Returns:
            CivicIssue if found, None otherwise.
        """
        if self._using_mock:
            data = self._mock_db["issues"].get(issue_id)
            return CivicIssue(**data) if data else None
        else:
            doc = self.client.collection("issues").document(issue_id).get()
            if doc.exists:
                return CivicIssue(**doc.to_dict())
            return None

    def list_issues(self) -> List[CivicIssue]:
        """List all persisted civic issues.
        
        Returns:
            List of CivicIssue instances.
        """
        if self._using_mock:
            return [CivicIssue(**data) for data in self._mock_db["issues"].values()]
        else:
            docs = self.client.collection("issues").stream()
            return [CivicIssue(**doc.to_dict()) for doc in docs]

    def delete_issue(self, issue_id: str) -> bool:
        """Delete a civic issue by ID.
        
        Returns:
            True if issue was deleted, False if not found.
        """
        if self._using_mock:
            if issue_id in self._mock_db["issues"]:
                del self._mock_db["issues"][issue_id]
                return True
            return False
        else:
            doc_ref = self.client.collection("issues").document(issue_id)
            if doc_ref.get().exists:
                doc_ref.delete()
                return True
            return False

    # --------------------------------------------------------------------------
    # CIE Pipeline Results Persistence (Collection: 'cie_results')
    # --------------------------------------------------------------------------

    def save_cie_result(
        self,
        result: CIEPipelineResponse,
        result_id: Optional[str] = None,
    ) -> str:
        """Save a complete CIE Pipeline evaluation execution record.
        
        Args:
            result: CIEPipelineResponse bundle to store.
            result_id: Optional unique result ID. Auto-generated if not provided.
            
        Returns:
            The saved result ID.
        """
        res_id = result_id or f"CIE-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_data = result.model_dump()
        doc_data["result_id"] = res_id
        doc_data["created_at"] = now_iso
        doc_data["issue_ids"] = [r.issue_id for r in result.validation_reports]

        if self._using_mock:
            self._mock_db["cie_results"][res_id] = doc_data
        else:
            self.client.collection("cie_results").document(res_id).set(doc_data)

        return res_id

    def get_cie_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a stored CIE Pipeline result dictionary by its ID.
        
        Args:
            result_id: Unique CIE result identifier.
            
        Returns:
            Result dict if found, None otherwise.
        """
        if self._using_mock:
            return self._mock_db["cie_results"].get(result_id)
        else:
            doc = self.client.collection("cie_results").document(result_id).get()
            return doc.to_dict() if doc.exists else None

    # --------------------------------------------------------------------------
    # Workflow Status Persistence (Collection: 'workflow')
    # --------------------------------------------------------------------------

    def save_workflow_record(self, workflow: WorkflowRecord) -> str:
        """Save or update an administrative workflow status for an issue.
        
        Args:
            workflow: WorkflowRecord instance.
            
        Returns:
            The target issue ID.
        """
        workflow.updated_at = datetime.now(timezone.utc).isoformat()
        doc_data = workflow.model_dump()

        if self._using_mock:
            self._mock_db["workflow"][workflow.issue_id] = doc_data
        else:
            self.client.collection("workflow").document(workflow.issue_id).set(doc_data)

        return workflow.issue_id

    def get_workflow_record(self, issue_id: str) -> Optional[WorkflowRecord]:
        """Retrieve the workflow tracking state for an issue.
        
        Args:
            issue_id: Civic issue identifier.
            
        Returns:
            WorkflowRecord if found, None otherwise.
        """
        if self._using_mock:
            data = self._mock_db["workflow"].get(issue_id)
            return WorkflowRecord(**data) if data else None
        else:
            doc = self.client.collection("workflow").document(issue_id).get()
            if doc.exists:
                return WorkflowRecord(**doc.to_dict())
            return None

    def list_workflow_records(self) -> List[WorkflowRecord]:
        """List all workflow tracking records.
        
        Returns:
            List of WorkflowRecord instances.
        """
        if self._using_mock:
            return [WorkflowRecord(**data) for data in self._mock_db["workflow"].values()]
        else:
            docs = self.client.collection("workflow").stream()
            return [WorkflowRecord(**doc.to_dict()) for doc in docs]

