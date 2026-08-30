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
from app.models.verification import VerificationResult

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


_GLOBAL_MOCK_DB: Dict[str, Dict[str, Any]] = {
    "users": {},
    "issues": {},
    "resources": {},
    "recommendations": {},
    "assignments": {},
    "resolutions": {},
    "contractors": {},
    "roads": {},
    "notifications": {},
    "cie_results": {},
    "workflow": {},
    "officers": {},
    "verification_results": {},
}


class DatabaseService:
    """Service managing Firestore data operations with graceful mock fallback."""

    def __init__(self, db_client=None, use_mock_if_missing: bool = True):
        """Initialize Firestore client or in-memory mock fallback.
        
        Args:
            db_client: Optional existing firestore client (useful for dependency injection/testing).
            use_mock_if_missing: If True, falls back to in-memory store if credentials are missing.
        """
        self._using_mock = False
        self._mock_db: Dict[str, Dict[str, Any]] = _GLOBAL_MOCK_DB

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
        now_iso = datetime.now(timezone.utc).isoformat()
        workflow.updated_at = now_iso
        doc_data = workflow.model_dump()

        if self._using_mock:
            self._mock_db["workflow"][workflow.issue_id] = doc_data
            if workflow.issue_id in self._mock_db["issues"]:
                self._mock_db["issues"][workflow.issue_id]["status"] = workflow.status
                self._mock_db["issues"][workflow.issue_id]["updated_at"] = now_iso
        else:
            self.client.collection("workflow").document(workflow.issue_id).set(doc_data)
            try:
                self.client.collection("issues").document(workflow.issue_id).update({
                    "status": workflow.status,
                    "updated_at": now_iso,
                })
            except Exception:
                pass

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

    # --------------------------------------------------------------------------
    # Synthetic Roads Persistence (Collection: 'roads')
    # --------------------------------------------------------------------------

    def save_road(self, road_dict: Dict[str, Any]) -> str:
        """Save or update a municipal road record in Firestore or mock store."""
        road_id = road_dict.get("road_id") or f"RD-{uuid.uuid4().hex[:6].upper()}"
        road_dict["road_id"] = road_id
        if self._using_mock:
            self._mock_db["roads"][road_id] = road_dict
        else:
            self.client.collection("roads").document(road_id).set(road_dict)
        return road_id

    def get_road(self, road_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single road record."""
        if self._using_mock:
            return self._mock_db["roads"].get(road_id)
        else:
            doc = self.client.collection("roads").document(road_id).get()
            return doc.to_dict() if doc.exists else None

    def list_roads(self) -> List[Dict[str, Any]]:
        """List all municipal roads."""
        if self._using_mock:
            return list(self._mock_db["roads"].values())
        else:
            docs = self.client.collection("roads").stream()
            return [doc.to_dict() for doc in docs]

    # --------------------------------------------------------------------------
    # Municipal Resources (Collection: 'resources')
    # --------------------------------------------------------------------------

    def save_resources(self, resources_dict: Dict[str, Any], doc_id: str = "current") -> str:
        """Save active municipal resource availability."""
        if self._using_mock:
            self._mock_db["resources"][doc_id] = resources_dict
        else:
            self.client.collection("resources").document(doc_id).set(resources_dict)
        return doc_id

    def get_resources(self, doc_id: str = "current") -> Optional[Dict[str, Any]]:
        """Retrieve active municipal resource constraints."""
        if self._using_mock:
            return self._mock_db["resources"].get(doc_id)
        else:
            doc = self.client.collection("resources").document(doc_id).get()
            return doc.to_dict() if doc.exists else None

    # --------------------------------------------------------------------------
    # Notifications (Collection: 'notifications')
    # --------------------------------------------------------------------------

    def save_notification(self, notif_dict: Dict[str, Any]) -> str:
        """Save a notification event."""
        notif_id = notif_dict.get("id") or f"NOTIF-{uuid.uuid4().hex[:8]}"
        notif_dict["id"] = notif_id
        notif_dict["created_at"] = notif_dict.get("created_at") or datetime.now(timezone.utc).isoformat()
        if self._using_mock:
            self._mock_db["notifications"][notif_id] = notif_dict
        else:
            self.client.collection("notifications").document(notif_id).set(notif_dict)
        return notif_id

    def list_notifications(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List notifications, optionally filtered by user ID."""
        if self._using_mock:
            notifs = list(self._mock_db["notifications"].values())
            if user_id:
                notifs = [n for n in notifs if n.get("user_id") == user_id or not n.get("user_id")]
            notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return notifs
        else:
            query = self.client.collection("notifications")
            if user_id:
                query = query.where("user_id", "==", user_id)
            docs = query.stream()
            res = [doc.to_dict() for doc in docs]
            res.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return res

    # --------------------------------------------------------------------------
    # Users (Collection: 'users')
    # --------------------------------------------------------------------------

    def save_user(self, user_dict: Dict[str, Any]) -> str:
        """Save or update user profile."""
        uid = user_dict.get("uid") or user_dict.get("id") or f"USR-{uuid.uuid4().hex[:6]}"
        user_dict["uid"] = uid
        if self._using_mock:
            self._mock_db["users"][uid] = user_dict
        else:
            self.client.collection("users").document(uid).set(user_dict)
        return uid

    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Retrieve user by UID."""
        if self._using_mock:
            return self._mock_db["users"].get(uid)
        else:
            doc = self.client.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None

    # --------------------------------------------------------------------------
<<<<<<< HEAD
    # Officers Registry (Collection: 'officers/{firebase_uid}')
    # --------------------------------------------------------------------------

    def save_officer(self, officer_dict: Dict[str, Any]) -> str:
        """Save or pre-provision a municipal officer in Firestore 'officers' collection."""
        uid = officer_dict.get("uid")
        if not uid:
            raise ValueError("Officer record must have a valid Firebase UID.")
        if self._using_mock:
            self._mock_db.setdefault("officers", {})[uid] = officer_dict
        else:
            self.client.collection("officers").document(uid).set(officer_dict)
        return uid

    def get_officer(self, uid: str) -> Optional[Dict[str, Any]]:
        """Retrieve an officer record by Firebase UID."""
        if not uid:
            return None
        if self._using_mock:
            return self._mock_db.setdefault("officers", {}).get(uid)
        else:
            doc = self.client.collection("officers").document(uid).get()
            return doc.to_dict() if doc.exists else None

    def list_officers(self) -> List[Dict[str, Any]]:
        """List all pre-provisioned municipal officers."""
        if self._using_mock:
            return list(self._mock_db.setdefault("officers", {}).values())
        else:
            docs = self.client.collection("officers").stream()
            return [doc.to_dict() for doc in docs]

    def delete_officer(self, uid: str) -> bool:
        """Remove an officer from registry."""
        if not uid:
            return False
        if self._using_mock:
            return bool(self._mock_db.setdefault("officers", {}).pop(uid, None))
        else:
            self.client.collection("officers").document(uid).delete()
            return True

    # --------------------------------------------------------------------------
    # Civic Trust & Verification Results (Collection: 'verification_results')
    # --------------------------------------------------------------------------

    def save_verification_result(self, result: VerificationResult) -> str:
        """Save or update a civic verification evaluation result in Firestore.
        
        Args:
            result: VerificationResult instance.
            
        Returns:
            The associated issue ID.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        if not result.evaluated_at:
            result.evaluated_at = now_iso

        doc_data = result.model_dump()

        if self._using_mock:
            self._mock_db["verification_results"][result.issue_id] = doc_data
        else:
            self.client.collection("verification_results").document(result.issue_id).set(doc_data)

        return result.issue_id

    def get_verification_result(self, issue_id: str) -> Optional[VerificationResult]:
        """Retrieve the verification result for a civic issue.
        
        Args:
            issue_id: Unique civic issue identifier.
            
        Returns:
            VerificationResult if found, None otherwise.
        """
        if self._using_mock:
            data = self._mock_db["verification_results"].get(issue_id)
            return VerificationResult(**data) if data else None
        else:
            doc = self.client.collection("verification_results").document(issue_id).get()
            if doc.exists:
                return VerificationResult(**doc.to_dict())
            return None

    def list_verification_results(self) -> List[VerificationResult]:
        """List all stored verification evaluation results.
        
        Returns:
            List of VerificationResult instances.
        """
        if self._using_mock:
            return [VerificationResult(**data) for data in self._mock_db["verification_results"].values()]
        else:
            docs = self.client.collection("verification_results").stream()
            return [VerificationResult(**doc.to_dict()) for doc in docs]

