export interface CitizenProfile {
  name: string;
  phone: string;
  address: string;
  ward: string;
}

export const MOCK_CITIZENS: CitizenProfile[] = [
  {
    name: 'Anand Patil',
    phone: '+91 98220 44112',
    address: 'Shivaji Chowk, Main Bazaar Road',
    ward: 'Ward 5 - Shivaji Chowk',
  },
  {
    name: 'Pooja Jadhav',
    phone: '+91 97654 22091',
    address: 'Subhash Nagar Lane 3',
    ward: 'Ward 3 - Subhash Nagar',
  },
  {
    name: 'Sunil Shinde',
    phone: '+91 94231 77652',
    address: 'Ghat Road, Godavari Bank',
    ward: 'Ward 7 - Bet Kopargaon Riverside',
  },
];
