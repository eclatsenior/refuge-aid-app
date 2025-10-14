import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

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
  employee_phone?: string;
  mood_level: number | null;
  therapy_progress: number | null;
  last_check_in: string | null;
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

export interface InternalMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  related_alert_id?: string;
  related_case_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'employee' | 'refugi_lead';

// Prevent duplicate alert notifications
const shownAlertToasts = new Set<string>();
let realtimeInitialized = false;
let employeeChannel: any = null;
let alertsChannel: any = null;
let messagesChannel: any = null;

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
  
  // Messaging
  messages: InternalMessage[];
  unreadMessageCount: number;
  
  // Subscription data
  subscription: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
    employee_limit: number;
  } | null;
  
  // Paywall & Access Control
  accessType: 'managed' | 'individual' | 'refugi_lead' | 'none' | null;
  showPaywall: boolean;
  
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
  registerEmployee: (data: { email: string; fullName: string; password: string; phone?: string }) => Promise<void>;
  
  // Subscription actions
  loadSubscriptionStatus: () => Promise<void>;
  canAddEmployee: () => boolean;
  
  // Paywall actions
  checkUserAccess: () => Promise<void>;
  shouldShowPaywall: () => boolean;
  setAccessType: (type: 'managed' | 'individual' | 'refugi_lead' | 'none') => void;
  
  // Messaging actions
  loadMessages: () => Promise<void>;
  sendMessage: (recipientId: string, message: string, relatedAlertId?: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  
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
      messages: [],
      unreadMessageCount: 0,
      subscription: null,
      accessType: null,
      showPaywall: false,
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
          // Normalize credentials to prevent login issues
          const normalizedEmail = email.trim().toLowerCase();
          const normalizedPassword = password.trim();
          
          console.log('🔐 Attempting login with normalized email:', normalizedEmail);
          
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword
          });
          
          if (error) {
            console.error('❌ Login error:', error.message);
          } else {
            console.log('✅ Login successful');
          }
          
          return { error };
        } catch (error) {
          console.error('❌ Login exception:', error);
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

          const { setAuth, setProfile, loadSubscriptionStatus, loadMessages } = get();
          
          // Always set auth state first
          setAuth(session?.user ?? null, session);
          console.log('✅ Auth state set:', { hasUser: !!session?.user, hasSession: !!session });
          
          if (session?.user) {
            // Load user profile with retry logic
            let profile = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!profile && attempts < maxAttempts) {
              attempts++;
              console.log(`🔄 Loading profile (attempt ${attempts}/${maxAttempts})...`);
              
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (data) {
                profile = data;
                console.log('✅ Profile loaded:', { role: profile.role });
                break;
              }
              
              if (profileError && profileError.code !== 'PGRST116') {
                // Error other than "not found"
                console.error('❌ Profile error:', profileError);
              }
              
              // Wait before retry
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            // If profile still doesn't exist, create it automatically
            if (!profile) {
              console.log('📝 Profile not found, creating automatically...');
              const role = session.user.user_metadata?.role || 'employee';
              const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  user_id: session.user.id,
                  email: session.user.email,
                  full_name: fullName,
                  role: role
                })
                .select()
                .single();
                
              if (createError) {
                console.error('❌ Error creating profile:', createError);
              } else if (newProfile) {
                profile = newProfile;
                console.log('✅ Profile created:', { role: profile.role });
              }
            }
            
            // Always set profile, even if null
            if (profile) {
              setProfile(profile);
              
              // Load messages for all users
              await loadMessages();
              
              // Check user access for employees (non-blocking)
              setTimeout(() => {
                get().checkUserAccess();
                const { showPaywall, accessType } = get();
                console.log('🔐 Access check complete:', { 
                  showPaywall, 
                  accessType,
                  role: profile.role 
                });
              }, 0);
              
              // Load subscription status for Refugi Leads
              if (profile.role === 'refugi_lead') {
                await loadSubscriptionStatus();
              }
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

          // CRITICAL: Force immediate dashboard refresh for all Refugi Leads
          // Small delay to ensure database synchronization
          setTimeout(() => {
            console.log('📢 Dispatching force-dashboard-refresh event');
            window.dispatchEvent(new CustomEvent('force-dashboard-refresh'));
          }, 100);

          // Show success toast
          toast({
            title: "Emergencia Activada",
            description: "Se ha notificado tu situación al equipo de soporte. Mantente segura."
          });

        } catch (error) {
          console.error('❌ Error triggering emergency:', error);
          
          // Show error toast
          toast({
            title: "Error",
            description: "No se pudo activar la emergencia. Intenta nuevamente.",
            variant: "destructive"
          });
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
            employee_phone: emp.phone,
            is_online: emp.is_online || false,
            mood_level: emp.mood_level ?? null,
            therapy_progress: emp.therapy_progress ?? 0,
            last_check_in: emp.last_check_in ?? null,
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
            employee_name: alert.profiles?.full_name || 
                          get().assignedEmployees.find(e => e.employee_id === alert.employee_id)?.employee_name || 
                          'Usuario desconocido',
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
      registerEmployee: async (data: { email: string; fullName: string; password: string; phone?: string }) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No estás autenticado');

          console.log('🔐 Registering new employee:', data.email);

          const { data: result, error } = await supabase.functions.invoke('register-employee', {
            body: {
              email: data.email,
              fullName: data.fullName,
              password: data.password,
              phone: data.phone,
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

      // Load subscription status
      loadSubscriptionStatus: async () => {
        try {
          const { user } = get();
          if (!user) {
            set({ subscription: null });
            return;
          }

          console.log('💳 Loading subscription status...');

          const { data, error } = await supabase.functions.invoke('check-subscription');

          if (error) throw error;

          console.log('✅ Subscription status loaded:', data);
          set({ subscription: data });
        } catch (error: any) {
          console.error('❌ Error loading subscription status:', error);
          set({ subscription: null });
        }
      },

      // Check if can add more employees
      canAddEmployee: () => {
        const { subscription, assignedEmployees } = get();
        if (!subscription?.subscribed) return false;
        if (subscription.employee_limit === 0) return false;
        return assignedEmployees.length < subscription.employee_limit;
      },

      // Paywall actions
      setAccessType: (type) => set({ accessType: type }),
      
      checkUserAccess: async () => {
        const { profile, user } = get();
        
        if (!user || !profile) {
          set({ showPaywall: false, accessType: null });
          return;
        }
        
        // Refugi Leads siempre tienen acceso
        if (profile.role === 'refugi_lead') {
          set({ showPaywall: false, accessType: 'refugi_lead' });
          return;
        }
        
        // Para empleados, verificar suscripción
        if (profile.role === 'employee') {
          try {
            const { data, error } = await supabase.functions.invoke('check-subscription');
            
            if (error) {
              console.error('Error checking subscription:', error);
              set({ showPaywall: true, accessType: 'none' });
              return;
            }
            
            if (data?.subscribed) {
              const accessType = data.type || 'individual';
              set({ 
                showPaywall: false, 
                accessType: accessType,
                subscription: data 
              });
            } else {
              set({ 
                showPaywall: true, 
                accessType: 'none',
                subscription: null 
              });
            }
          } catch (error) {
            console.error('Exception checking subscription:', error);
            set({ showPaywall: true, accessType: 'none' });
          }
        }
      },
      
      shouldShowPaywall: () => {
        const { profile, showPaywall, accessType } = get();
        return profile?.role === 'employee' && (showPaywall || accessType === 'none');
      },

      // Setup realtime subscriptions
      setupRealtimeSubscriptions: () => {
        // Prevent duplicate subscriptions
        if (realtimeInitialized) {
          console.log('ℹ️ Realtime subscriptions already initialized');
          return () => {
            if (employeeChannel) employeeChannel.unsubscribe();
            if (alertsChannel) alertsChannel.unsubscribe();
          };
        }

        realtimeInitialized = true;
        const { loadEmployeeData, loadEmergencyAlerts } = get();

        // Subscribe to employee status changes
        employeeChannel = supabase
          .channel('employee-status-changes')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'employee_status'
          }, (payload) => {
            console.log('👥 Employee status changed:', payload);
            loadEmployeeData(); // Refresh employee data
            
            // Check if emergency_alert changed from false to true
            const oldRecord = payload.old as any;
            const newRecord = payload.new as any;
            
            if (oldRecord?.emergency_alert === false && newRecord?.emergency_alert === true) {
              console.log('🚨 Emergency alert activated!');
              loadEmergencyAlerts(); // Immediately refresh alerts
            }
          })
          .subscribe();

        // Subscribe to emergency alerts (only INSERT events)
        alertsChannel = supabase
          .channel('emergency-alerts-changes')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public', 
            table: 'emergency_alerts'
          }, async (payload) => {
            console.log('🚨 New emergency alert:', payload);
            
            const alertId = payload.new?.id as string;
            const employeeId = payload.new?.employee_id as string;
            
            // Prevent duplicate toasts
            if (shownAlertToasts.has(alertId)) {
              console.log('ℹ️ Alert toast already shown:', alertId);
              return;
            }
            
            // Mark alert as shown
            shownAlertToasts.add(alertId);
            
            // Try to get employee name from current state
            let employeeName = get().assignedEmployees.find(
              e => e.employee_id === employeeId
            )?.employee_name;
            
            // Play emergency sound with fallback to notification
            const audioEnabled = localStorage.getItem('audio-alerts-enabled') === 'true';
            
            if (audioEnabled) {
              try {
                const audio = new Audio('/emergency-alert.mp3');
                audio.volume = 0.7;
                
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log('✅ Alert sound played successfully');
                    })
                    .catch(err => {
                      console.warn('⚠️ Audio autoplay blocked, trying notification fallback');
                      
                      // Fallback: Try browser notification
                      if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('🚨 Alerta de Emergencia', {
                          body: employeeName ? `Alerta de ${employeeName}` : 'Alerta entrante',
                          icon: '/icon-192.png',
                          badge: '/icon-192.png',
                          tag: 'emergency-alert',
                          requireInteraction: true
                        });
                      }
                    });
                }
              } catch (error) {
                console.warn('⚠️ Audio not available:', error);
              }
            } else {
              console.log('ℹ️ Audio alerts disabled by user');
            }

            // Show toast (will update if name not available yet)
            const toastHandle = toast({
              title: "🚨 Nueva Alerta de Emergencia",
              description: employeeName ? `Alerta de ${employeeName}` : 'Alerta entrante...',
              variant: "destructive"
            });
            
            // If name not available, load data and update toast
            if (!employeeName) {
              await get().loadEmployeeData();
              employeeName = get().assignedEmployees.find(
                e => e.employee_id === employeeId
              )?.employee_name;
              
              if (employeeName && toastHandle?.update) {
                toastHandle.update({
                  id: toastHandle.id,
                  title: "Nueva Alerta de Emergencia",
                  description: `Alerta de ${employeeName}`,
                  variant: "destructive"
                });
              }
            }
            
            // Refresh alerts data
            loadEmergencyAlerts();
          })
          .subscribe();
        
        // Subscribe to internal messages
        messagesChannel = supabase
          .channel('internal-messages-changes')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'internal_messages',
            filter: `recipient_id=eq.${get().user?.id}`
          }, async (payload) => {
            console.log('💬 New message received:', payload);
            const newMessage = payload.new as any;
            
            // Get sender name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newMessage.sender_id)
              .maybeSingle();
            
            set(state => ({
              messages: [...state.messages, newMessage],
              unreadMessageCount: state.unreadMessageCount + 1
            }));
            
            // Show toast notification
            toast({
              title: "💬 Nuevo mensaje",
              description: `De ${profile?.full_name || 'Usuario'}`,
              duration: 5000,
            });
            
            // Play notification sound
            const audioEnabled = localStorage.getItem('audio-alerts-enabled') === 'true';
            if (audioEnabled) {
              try {
                const audio = new Audio('/message-notification.mp3');
                audio.volume = 0.5;
                await audio.play();
              } catch (error) {
                console.log('Audio notification not available');
              }
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'internal_messages'
          }, (payload) => {
            const updatedMessage = payload.new as any;
            set(state => ({
              messages: state.messages.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            }));
          })
          .subscribe();

        // Polling fallback for first 60 seconds (every 5 seconds)
        let pollCount = 0;
        const maxPolls = 12; // 12 * 5 seconds = 60 seconds
        const pollingInterval = setInterval(() => {
          pollCount++;
          console.log('🔄 Polling fallback:', pollCount);
          loadEmergencyAlerts();
          
          if (pollCount >= maxPolls) {
            clearInterval(pollingInterval);
            console.log('✅ Polling fallback completed');
          }
        }, 5000);

        console.log('🔄 Realtime subscriptions setup complete');
        
        return () => {
          clearInterval(pollingInterval);
          if (employeeChannel) employeeChannel.unsubscribe();
          if (alertsChannel) alertsChannel.unsubscribe();
          if (messagesChannel) messagesChannel.unsubscribe();
          realtimeInitialized = false;
        };
      },
      
      // Messaging actions
      loadMessages: async () => {
        const state = get();
        if (!state.user) return;

        const { data, error } = await supabase
          .from('internal_messages')
          .select('*')
          .or(`sender_id.eq.${state.user.id},recipient_id.eq.${state.user.id}`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        const unreadCount = data?.filter(
          (msg) => msg.recipient_id === state.user?.id && !msg.is_read
        ).length || 0;

        set({ messages: data || [], unreadMessageCount: unreadCount });
      },

      sendMessage: async (recipientId: string, message: string, relatedAlertId?: string) => {
        const state = get();
        if (!state.user) return;

        const { data, error } = await supabase
          .from('internal_messages')
          .insert({
            sender_id: state.user.id,
            recipient_id: recipientId,
            message,
            related_alert_id: relatedAlertId,
          })
          .select()
          .single();

        if (error) {
          console.error('Error sending message:', error);
          throw error;
        }

        set((state) => ({
          messages: [...state.messages, data],
        }));
      },

      markMessageAsRead: async (messageId: string) => {
        const { error } = await supabase
          .from('internal_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', messageId);

        if (error) {
          console.error('Error marking message as read:', error);
          return;
        }

        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
          ),
          unreadMessageCount: Math.max(0, state.unreadMessageCount - 1),
        }));
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

// Auth state listener - enhanced to reload profile on sign in
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setAuth, initializeAuth } = useAppStore.getState();
  
  console.log('🔐 Auth state changed:', event);
  
  if (event === 'SIGNED_IN') {
    console.log('🔐 SIGNED_IN event detected, initializing full auth...');
    setAuth(session?.user ?? null, session);
    // Reload profile and related data
    await initializeAuth();
  } else if (event === 'SIGNED_OUT') {
    console.log('🚪 SIGNED_OUT event detected');
    setAuth(null, null);
  } else if (event === 'TOKEN_REFRESHED') {
    setAuth(session?.user ?? null, session);
  }
});