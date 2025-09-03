import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isStarred: boolean;
  isSafeVault: boolean;
  forTherapy: boolean;
  tags: string[];
}

export interface SUDS {
  id: string;
  level: number;
  notes: string;
  timestamp: Date;
}

export interface CheckIn {
  id: string;
  mood: number;
  status: 'ok' | 'anxious' | 'alert';
  timestamp: Date;
  notes?: string;
  location?: string;
}

export interface Settings {
  emergencyContacts: TrustedContact[];
  emergencyMessage: string;
  enableGeolocation: boolean;
  privacyMode: boolean;
  phoneVibration: boolean;
  soundAlerts: boolean;
  checkinFrequency: 'daily' | 'weekly' | 'off';
  quietHoursStart: string;
  quietHoursEnd: string;
  locationConsent: boolean;
  alertMessageTemplate: string;
  isDiscreetMode: boolean;
  hasBiometrics: boolean;
  autoLockMinutes: number;
}

export interface EmployeeStatus {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  mood_level: number;
  therapy_progress: number;
  last_check_in: string;
  is_online: boolean;
  emergency_alert: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyAlert {
  id: string;
  employee_id: string;
  employee_name: string;
  alert_type: string;
  message?: string;
  location_data?: any;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export type UserRole = 'employee' | 'refugi_lead';

const defaultSettings: Settings = {
  emergencyContacts: [],
  emergencyMessage: "Necesito ayuda urgente. Esta es una alerta automática de la aplicación Refugi.",
  enableGeolocation: true,
  privacyMode: false,
  phoneVibration: true,
  soundAlerts: true,
  checkinFrequency: 'daily',
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  locationConsent: false,
  alertMessageTemplate: "Necesito ayuda. Estoy en riesgo. Este es un aviso automático de Refugi.",
  isDiscreetMode: false,
  hasBiometrics: false,
  autoLockMinutes: 5
};

interface AppState {
  // Authentication
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: any | null;
  isAuthenticated: boolean;
  userId: string | null;
  
  // Employee data
  notes: Note[];
  checkIns: CheckIn[];
  sudsRecords: SUDS[];
  settings: Settings;
  trustedContacts: TrustedContact[];
  
  // Refugi Lead data
  assignedEmployees: EmployeeStatus[];
  emergencyAlerts: EmergencyAlert[];
  
  // Security
  vaultLocked: boolean;
  decoyScreenActive: boolean;
  isVaultLocked: boolean;
  showDecoyScreen: boolean;
  
  // Authentication actions
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: any) => void;
  logout: () => void;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  
  // Employee actions
  addNote: (note: Omit<Note, "id" | "isEncrypted" | "createdAt" | "updatedAt" | "isStarred" | "isSafeVault" | "forTherapy" | "tags">) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => void;
  deleteNote: (id: string) => void;
  addCheckIn: (checkIn: Omit<CheckIn, "id">) => void;
  addSUDS: (suds: Omit<SUDS, "id">) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  triggerEmergency: () => void;
  
  // Refugi Lead actions
  loadEmployeeData: () => Promise<void>;
  loadEmergencyAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  
  // Trusted Contacts actions
  addTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  updateTrustedContact: (id: string, contact: Partial<TrustedContact>) => void;
  deleteTrustedContact: (id: string) => void;
  
  // Note advanced actions
  toggleVaultStatus: (id: string) => void;
  toggleTherapyFlag: (id: string) => void;
  quickDeleteNote: (id: string, confirmWord: string) => boolean;

  // Security actions
  toggleVaultLock: () => void;
  unlockVault: (password: string) => boolean;
  toggleDecoyScreen: () => void;
  activateDecoyScreen: () => void;
  deactivateDecoyScreen: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      userRole: null,
      profile: null,
      isAuthenticated: false,
      userId: null,
      notes: [],
      checkIns: [],
      sudsRecords: [],
      settings: defaultSettings,
      trustedContacts: [],
      assignedEmployees: [],
      emergencyAlerts: [],
      vaultLocked: false,
      decoyScreenActive: false,
      isVaultLocked: true,
      showDecoyScreen: false,
      
      // Authentication actions
      setAuth: (user, session) => {
        set({ 
          user, 
          session, 
          isAuthenticated: !!user,
          userRole: user ? 'employee' : null // Will be updated when profile loads
        });
      },
      
      setProfile: (profile) => {
        set({ 
          profile, 
          userRole: profile?.role || 'employee'
        });
      },
      
      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          profile: null,
          userRole: null,
          isAuthenticated: false,
          assignedEmployees: [],
          emergencyAlerts: []
        });
      },
      
      signUp: async (email, password, fullName, role) => {
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: fullName,
                role: role
              }
            }
          });
          
          return { error };
        } catch (error) {
          return { error };
        }
      },
      
      signIn: async (email, password) => {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          return { error };
        } catch (error) {
          return { error };
        }
      },
      
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

      // Employee actions
      addNote: (note) =>
        set((state) => ({
          notes: [...state.notes, { 
            ...note, 
            id: crypto.randomUUID(),
            isEncrypted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            isStarred: false,
            isSafeVault: false,
            forTherapy: false,
            tags: []
          }]
        })),
      
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n)
        })),
      
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id)
        })),
      
      toggleVaultStatus: (id) =>
        set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, isSafeVault: !n.isSafeVault, updatedAt: new Date() } : n
          )
        })),
      
      toggleTherapyFlag: (id) =>
        set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, forTherapy: !n.forTherapy, updatedAt: new Date() } : n
          )
        })),
      
      quickDeleteNote: (id, confirmWord) => {
        if (confirmWord.toUpperCase() !== 'BORRAR') {
          return false;
        }
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id)
        }));
        return true;
      },

      addCheckIn: (checkIn) =>
        set((state) => ({
          checkIns: [...state.checkIns, { ...checkIn, id: crypto.randomUUID() }]
        })),
      
      addSUDS: (suds) =>
        set((state) => ({
          sudsRecords: [...state.sudsRecords, { ...suds, id: crypto.randomUUID() }]
        })),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      triggerEmergency: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          // Create emergency alert in database
          const { error } = await supabase.from('emergency_alerts').insert({
            employee_id: user.id,
            alert_type: 'emergency',
            message: 'Alerta de emergencia activada desde la aplicación',
            location_data: null // Would get location here
          });
          
          if (error) {
            console.error('Error creating emergency alert:', error);
          }
        } catch (error) {
          console.error('Error triggering emergency:', error);
        }
      },
      
      // Refugi Lead actions
      loadEmployeeData: async () => {
        try {
          // Mock data for now - would load from Supabase
          const mockEmployees: EmployeeStatus[] = [
            {
              id: '1',
              employee_id: 'emp1',
              employee_name: 'María García',
              employee_email: 'maria@refugi.com',
              mood_level: 7,
              therapy_progress: 65,
              last_check_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              is_online: true,
              emergency_alert: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              employee_id: 'emp2', 
              employee_name: 'Ana López',
              employee_email: 'ana@refugi.com',
              mood_level: 4,
              therapy_progress: 30,
              last_check_in: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
              is_online: false,
              emergency_alert: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              employee_id: 'emp3',
              employee_name: 'Carmen Ruiz',
              employee_email: 'carmen@refugi.com',
              mood_level: 8,
              therapy_progress: 80,
              last_check_in: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              is_online: true,
              emergency_alert: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          set({ assignedEmployees: mockEmployees });
        } catch (error) {
          console.error('Error loading employee data:', error);
        }
      },
      
      loadEmergencyAlerts: async () => {
        try {
          // Mock data for now
          const mockAlerts: EmergencyAlert[] = [
            {
              id: '1',
              employee_id: 'emp2',
              employee_name: 'Ana López',
              alert_type: 'emergency',
              message: 'Necesito ayuda urgente',
              location_data: null,
              is_resolved: false,
              created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
            }
          ];
          
          set({ emergencyAlerts: mockAlerts });
        } catch (error) {
          console.error('Error loading emergency alerts:', error);
        }
      },
      
      resolveAlert: async (alertId) => {
        try {
          // Would update in Supabase
          set((state) => ({
            emergencyAlerts: state.emergencyAlerts.map(alert =>
              alert.id === alertId 
                ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
                : alert
            ),
            assignedEmployees: state.assignedEmployees.map(emp =>
              state.emergencyAlerts.find(a => a.id === alertId)?.employee_id === emp.employee_id
                ? { ...emp, emergency_alert: false }
                : emp
            )
          }));
        } catch (error) {
          console.error('Error resolving alert:', error);
        }
      },
      
      // Security actions
      toggleVaultLock: () =>
        set((state) => ({ 
          vaultLocked: !state.vaultLocked,
          isVaultLocked: !state.isVaultLocked 
        })),
      
      unlockVault: (password) => {
        if (password.length > 0) {
          set({ vaultLocked: false, isVaultLocked: false });
          return true;
        }
        return false;
      },
      
      toggleDecoyScreen: () =>
        set((state) => ({ 
          decoyScreenActive: !state.decoyScreenActive,
          showDecoyScreen: !state.showDecoyScreen
        })),
        
      activateDecoyScreen: () =>
        set({ showDecoyScreen: true, decoyScreenActive: true }),
      
      deactivateDecoyScreen: () =>
        set({ showDecoyScreen: false, decoyScreenActive: false })
    }),
    {
      name: 'refugi-storage',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          // Don't persist alert message template for security
          alertMessageTemplate: defaultSettings.alertMessageTemplate
        },
        notes: state.notes,
        checkIns: state.checkIns,
        sudsRecords: state.sudsRecords,
        trustedContacts: state.trustedContacts
      })
    }
  )
);

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setAuth, setProfile } = useAppStore.getState();
  
  setAuth(session?.user ?? null, session);
  
  if (session?.user) {
    // Load user profile
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) {
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
});

// Initialize session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  const { setAuth } = useAppStore.getState();
  setAuth(session?.user ?? null, session);
});