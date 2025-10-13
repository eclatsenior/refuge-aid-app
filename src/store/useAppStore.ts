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
  initializeAuth: () => Promise<void>;
  
  // Employee actions
  addNote: (note: Omit<Note, "id" | "isEncrypted" | "createdAt" | "updatedAt" | "isStarred" | "isSafeVault" | "forTherapy" | "tags">) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => void;
  deleteNote: (id: string) => void;
  addCheckIn: (checkIn: Omit<CheckIn, "id">) => void;
  addSUDS: (suds: Omit<SUDS, "id">) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  triggerEmergency: (message?: string, locationData?: any) => Promise<void>;
  
  // Refugi Lead actions
  loadEmployeeData: () => Promise<void>;
  loadEmergencyAlerts: () => Promise<void>;
  resolveAlert: (alertId: string, resolutionNotes?: string) => Promise<void>;
  setupRealtimeSubscriptions: () => (() => void) | undefined;
  updateEmployeePresence: (isOnline?: boolean) => Promise<void>;
  registerEmployee: (data: { email: string; fullName: string; password: string }) => Promise<void>;
  
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
          userRole: null // Will be set when profile loads
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
      
      initializeAuth: async () => {
        try {
          console.log('🔐 Initializing authentication...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            return;
          }

          const { setAuth, setProfile } = get();
          
          // Always set auth state first
          setAuth(session?.user ?? null, session);
          console.log('✅ Auth state set:', { hasUser: !!session?.user, hasSession: !!session });
          
          if (session?.user) {
            // Load user profile
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (profileError) {
                console.warn('⚠️ Profile error (may not exist yet):', profileError);
              } else if (profile) {
                setProfile(profile);
                console.log('✅ Profile loaded:', { role: profile.role });
              }
            } catch (error) {
              console.error('❌ Profile loading failed:', error);
            }
          }
          
          console.log('🚀 Authentication initialization complete');
        } catch (error) {
          console.error('❌ Critical auth initialization error:', error);
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
      
      triggerEmergency: async (message?: string, locationData?: any) => {
        try {
          const { user } = get();
          if (!user) {
            console.error('❌ No user found for emergency trigger');
            return;
          }

          console.log('🚨 Triggering emergency alert...');

          // Create emergency alert in database
          const { data: alert, error: alertError } = await supabase
            .from('emergency_alerts')
            .insert({
              employee_id: user.id,
              alert_type: 'emergency',
              message: message || 'Emergencia activada desde la aplicación',
              location_data: locationData
            })
            .select()
            .single();

          if (alertError) {
            console.error('❌ Error creating emergency alert:', alertError);
            throw alertError;
          }

          // Update employee status to show emergency
          const { error: statusError } = await supabase
            .from('employee_status')
            .update({
              emergency_alert: true,
              updated_at: new Date().toISOString()
            })
            .eq('employee_id', user.id);

          if (statusError) {
            console.error('❌ Error updating employee status:', statusError);
          }

          console.log('✅ Emergency alert created:', alert);

          // Show success toast
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('show-toast', {
              detail: {
                title: "Emergencia Activada",
                description: "Se ha notificado tu situación al equipo de soporte. Mantente segura.",
                variant: "default"
              }
            });
            window.dispatchEvent(event);
          }

        } catch (error) {
          console.error('❌ Error triggering emergency:', error);
          
          // Show error toast
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('show-toast', {
              detail: {
                title: "Error",
                description: "No se pudo activar la emergencia. Intenta nuevamente.",
                variant: "destructive"
              }
            });
            window.dispatchEvent(event);
          }
        }
      },
      
      // Refugi Lead actions
      loadEmployeeData: async () => {
        try {
          console.log('📊 Loading assigned employee data...');
          
          // Get assignments for current refugi_lead, then fetch employee details
          const { data: assignments, error: assignmentError } = await supabase
            .from('employee_assignments')
            .select('employee_id');

          if (assignmentError) {
            console.error('❌ Error loading assignments:', assignmentError);
            throw assignmentError;
          }

          if (!assignments || assignments.length === 0) {
            console.log('📊 No assigned employees found');
            set({ assignedEmployees: [] });
            return;
          }

          const employeeIds = assignments.map(a => a.employee_id);

          // Get employee status for assigned employees using database function
          const { data: employees, error } = await supabase
            .rpc('get_employee_data_with_profiles', { employee_ids: employeeIds });

          if (error) {
            console.error('❌ Error loading employee data:', error);
            throw error;
          }

          const formattedEmployees: EmployeeStatus[] = employees?.map(emp => ({
            id: emp.id,
            employee_id: emp.employee_id,
            employee_name: emp.full_name || 'Usuario desconocido',
            employee_email: emp.email || 'unknown@email.com',
            is_online: emp.is_online || false,
            mood_level: emp.mood_level || 5,
            therapy_progress: emp.therapy_progress || 0,
            last_check_in: emp.last_check_in || new Date().toISOString(),
            emergency_alert: emp.emergency_alert || false,
            created_at: emp.created_at,
            updated_at: emp.updated_at
          })) || [];

          console.log('✅ Assigned employee data loaded:', formattedEmployees);
          set({ assignedEmployees: formattedEmployees });
        } catch (error) {
          console.error('❌ Error loading assigned employees:', error);
        }
      },
      
      loadEmergencyAlerts: async () => {
        try {
          console.log('🚨 Loading emergency alerts...');
          
          // Get assignments for current refugi_lead
          const { data: assignments, error: assignmentError } = await supabase
            .from('employee_assignments')
            .select('employee_id');

          if (assignmentError) {
            console.error('❌ Error loading assignments:', assignmentError);
            throw assignmentError;
          }
          
          // If no assignments, return empty array
          if (!assignments || assignments.length === 0) {
            console.log('ℹ️ No assigned employees, no alerts to show');
            set({ emergencyAlerts: [] });
            return;
          }
          
          const employeeIds = assignments.map(a => a.employee_id);
          console.log('👥 Loading alerts for assigned employees:', employeeIds);
          
          const { data: alerts, error } = await supabase
            .from('emergency_alerts')
            .select(`
              *,
              profiles!emergency_alerts_employee_id_fkey (full_name)
            `)
            .in('employee_id', employeeIds)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Error loading alerts:', error);
            throw error;
          }

          const formattedAlerts: EmergencyAlert[] = alerts?.map(alert => ({
            id: alert.id,
            employee_id: alert.employee_id,
            employee_name: alert.profiles?.full_name || 'Usuario desconocido',
            alert_type: alert.alert_type,
            message: alert.message || '',
            created_at: alert.created_at,
            is_resolved: alert.is_resolved || false,
            resolved_by: alert.resolved_by,
            resolved_at: alert.resolved_at,
            location_data: alert.location_data as any
          })) || [];

          console.log('✅ Emergency alerts loaded:', formattedAlerts);
          set({ emergencyAlerts: formattedAlerts });
        } catch (error) {
          console.error('❌ Error loading emergency alerts:', error);
        }
      },
      
      resolveAlert: async (alertId: string, resolutionNotes?: string) => {
        try {
          const { user } = get();
          if (!user) return;

          console.log('✅ Resolving alert:', alertId);

          // Update alert in database
          const { data: alert, error: alertError } = await supabase
            .from('emergency_alerts')
            .update({
              is_resolved: true,
              resolved_by: user.id,
              resolved_at: new Date().toISOString()
            })
            .eq('id', alertId)
            .select()
            .single();

          if (alertError) {
            console.error('❌ Error resolving alert:', alertError);
            throw alertError;
          }

          // Update employee status to clear emergency flag
          const { error: statusError } = await supabase
            .from('employee_status')
            .update({
              emergency_alert: false,
              updated_at: new Date().toISOString()
            })
            .eq('employee_id', alert.employee_id);

          if (statusError) {
            console.error('❌ Error updating employee status:', statusError);
          }

          console.log('✅ Alert resolved successfully');

          // Refresh data to show changes
          get().loadEmergencyAlerts();
          get().loadEmployeeData();

        } catch (error) {
          console.error('❌ Error resolving alert:', error);
        }
      },

      // Heartbeat system to track employee presence
      updateEmployeePresence: async (isOnline: boolean = true) => {
        try {
          const { user } = get();
          if (!user) return;

          const { error } = await supabase
            .from('employee_status')
            .update({
              is_online: isOnline,
              last_check_in: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('employee_id', user.id);

          if (error) {
            console.error('❌ Error updating presence:', error);
          } else {
            console.log('💓 Heartbeat updated:', { isOnline });
          }
        } catch (error) {
          console.error('❌ Error in heartbeat:', error);
        }
      },

      // Register new employee
      registerEmployee: async (data: { email: string; fullName: string; password: string }) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No estás autenticado');

          console.log('🔐 Registering new employee:', data.email);

          const { data: result, error } = await supabase.functions.invoke('register-employee', {
            body: {
              email: data.email,
              fullName: data.fullName,
              password: data.password,
              refugiLeadId: user.id,
            },
          });

          if (error) throw error;
          if (!result?.success) throw new Error(result?.message || 'Error al registrar empleada');

          console.log('✅ Employee registered successfully:', result);
        } catch (error: any) {
          console.error('❌ Error registering employee:', error);
          throw error;
        }
      },

      // Setup realtime subscriptions
      setupRealtimeSubscriptions: () => {
        const { loadEmployeeData, loadEmergencyAlerts } = get();

        // Subscribe to employee status changes
        const employeeChannel = supabase
          .channel('employee-status-changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'employee_status'
          }, (payload) => {
            console.log('👥 Employee status changed:', payload);
            loadEmployeeData(); // Refresh employee data
          })
          .subscribe();

        // Subscribe to emergency alerts
        const alertsChannel = supabase
          .channel('emergency-alerts-changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public', 
            table: 'emergency_alerts'
          }, (payload) => {
            console.log('🚨 Emergency alert changed:', payload);
            loadEmergencyAlerts(); // Refresh alerts data
            
            // Show toast for new alerts
            if (payload.eventType === 'INSERT' && typeof window !== 'undefined') {
              const event = new CustomEvent('show-toast', {
                detail: {
                  title: "Nueva Alerta de Emergencia",
                  description: "Una empleada ha activado una alerta de emergencia",
                  variant: "destructive"
                }
              });
              window.dispatchEvent(event);
            }
          })
          .subscribe();

        console.log('🔄 Realtime subscriptions setup complete');
        
        return () => {
          employeeChannel.unsubscribe();
          alertsChannel.unsubscribe();
        };
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

// Auth state listener - only for session changes, not initialization
supabase.auth.onAuthStateChange((event, session) => {
  const { setAuth } = useAppStore.getState();
  
  // Only update auth state on sign in/out events, not during initialization
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    setAuth(session?.user ?? null, session);
  }
});