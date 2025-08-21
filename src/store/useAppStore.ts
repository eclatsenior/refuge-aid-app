import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isStarred: boolean;
}

export interface CheckIn {
  id: string;
  status: 'ok' | 'anxious' | 'alert';
  timestamp: Date;
  location?: string;
}

export interface Settings {
  checkinFrequency: 'daily' | 'weekly' | 'off';
  quietHoursStart: string;
  quietHoursEnd: string;
  locationConsent: boolean;
  alertMessageTemplate: string;
  isDiscreetMode: boolean;
  hasBiometrics: boolean;
  autoLockMinutes: number;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;
  
  // Data
  trustedContacts: TrustedContact[];
  notes: Note[];
  checkIns: CheckIn[];
  settings: Settings;
  
  // Actions
  setAuthenticated: (userId: string) => void;
  logout: () => void;
  
  // Trusted Contacts
  addTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  updateTrustedContact: (id: string, contact: Partial<TrustedContact>) => void;
  deleteTrustedContact: (id: string) => void;
  
  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Check-ins
  addCheckIn: (checkIn: Omit<CheckIn, 'id'>) => void;
  
  // Settings
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Emergency Actions
  triggerEmergency: (action: 'call' | 'whatsapp' | 'sms') => void;
}

const defaultSettings: Settings = {
  checkinFrequency: 'daily',
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  locationConsent: false,
  alertMessageTemplate: "Necesito ayuda. Estoy en riesgo. Este es un aviso automático de Refugi.",
  isDiscreetMode: false,
  hasBiometrics: false,
  autoLockMinutes: 5
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      userId: null,
      trustedContacts: [],
      notes: [],
      checkIns: [],
      settings: defaultSettings,
      
      // Auth actions
      setAuthenticated: (userId: string) => 
        set({ isAuthenticated: true, userId }),
      
      logout: () => 
        set({ isAuthenticated: false, userId: null }),
      
      // Trusted Contacts actions
      addTrustedContact: (contact) =>
        set((state) => ({
          trustedContacts: [
            ...state.trustedContacts,
            { ...contact, id: crypto.randomUUID() }
          ]
        })),
      
      updateTrustedContact: (id, contact) =>
        set((state) => ({
          trustedContacts: state.trustedContacts.map(tc =>
            tc.id === id ? { ...tc, ...contact } : tc
          )
        })),
      
      deleteTrustedContact: (id) =>
        set((state) => ({
          trustedContacts: state.trustedContacts.filter(tc => tc.id !== id)
        })),
      
      // Notes actions
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        })),
      
      updateNote: (id, note) =>
        set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, ...note, updatedAt: new Date() } : n
          )
        })),
      
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id)
        })),
      
      // Check-ins actions
      addCheckIn: (checkIn) =>
        set((state) => ({
          checkIns: [
            ...state.checkIns,
            { ...checkIn, id: crypto.randomUUID() }
          ]
        })),
      
      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      // Emergency actions
      triggerEmergency: (action) => {
        // Analytics event would be sent here
        console.log(`Emergency action triggered: ${action}`);
        
        const { settings, trustedContacts } = get();
        
        if (action === 'call') {
          // Already handled in EmergencyButton component
          return;
        }
        
        if (action === 'whatsapp' || action === 'sms') {
          // Send to trusted contacts
          trustedContacts
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 3) // Top 3 priority contacts
            .forEach(contact => {
              const message = settings.alertMessageTemplate;
              // Implementation would handle actual WhatsApp/SMS sending
              console.log(`Sending alert to ${contact.name} (${contact.phone}): ${message}`);
            });
        }
      }
    }),
    {
      name: 'refugi-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        settings: {
          ...state.settings,
          // Don't persist alert message template for security
          alertMessageTemplate: defaultSettings.alertMessageTemplate
        },
        trustedContacts: state.trustedContacts,
        // Notes would be encrypted before persisting in a real app
        checkIns: state.checkIns
      })
    }
  )
);