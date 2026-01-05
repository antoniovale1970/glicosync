
export interface UserAccount {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed. For local storage demo, plain text is used.
  name: string;
  email?: string;
  isBlocked?: boolean; // New field for admin control
  allowedViews?: string[]; // Array of menu IDs that the user is allowed to access
  planType?: 'Standard' | 'Premium'; // Access level
  
  // New Admin Constraints
  accessExpirationDate?: string; // YYYY-MM-DD
  maxRecords?: number; // Limit on glucose readings (0 or undefined = unlimited)
  dashboardPermissions?: {
      showCharts: boolean;
      showStats: boolean;
      showAlerts: boolean;
      showNews: boolean;
      showHydration: boolean;
  };
}

export interface UserProfile {
  name: string;
  age: string;
  birthDate: string;
  gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não dizer' | '';
  bloodType: string;
  healthConditions: string[];
  weight: string;
  height: string;
  diabetesType: 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'Outro' | '';
  photo?: string;
  allergies: string[];
}

export interface GlucoseReading {
  id: string;
  value: number;
  date: string;
  notes?: string;
}

export interface Reminder {
    time: string;
    note?: string;
    days?: string[]; // Dom, Seg, Ter, Qua, Qui, Sex, Sáb
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderEnabled?: boolean;
  reminderTimes?: Reminder[];
  photo?: string; // New field for medication photo
  leaflet?: string; // New field for stored leaflet text
}

export interface InsulinSchedule {
  id: string;
  name: string;
  type: 'Rápida' | 'Ultrarrápida' | 'Intermediária' | 'Lenta' | 'Pré-misturada' | 'Outra';
  defaultDosage: string; // units
  reminderEnabled: boolean;
  reminderTimes?: Reminder[];
}

export interface InsulinRecord {
    id: string;
    scheduleId?: string; // Link to schedule if applicable
    name: string;
    units: number;
    date: string;
    type: string;
    notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'Médico' | 'Familiar' | 'Emergência' | 'Clínica' | 'Hospital' | 'Laboratório' | 'Farmácia / Drogaria' | 'Outro';
  phone: string;
  email?: string;
  specialty?: string;
  photo?: string;
  workplaceIds?: string[];
  notes?: string;
}

export interface Exam {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  result: string;
  unit?: string; // New field for measurement unit (e.g., mg/dL, %)
  resultStatus?: 'normal' | 'borderline' | 'abnormal'; // New field for traffic light system
  reminderEnabled?: boolean;
  reminderConfig?: {
    type: 'daysBefore' | 'specificDate';
    value: number | string; // number for days, string for date YYYY-MM-DD
  };
  laboratoryId?: string; // Legacy field for linking to contact ID
  location?: string; // New field for flexible text location
  completed?: boolean;
  aiAnalysis?: string; // New field for AI Analysis text
}

export interface Meal {
  id: string;
  type: 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche' | 'Sobremesa' | 'Ceia';
  date: string;
  description: string;
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
  photo?: string; // Base64 string
  aiAnalysis?: string; // Markdown analysis from Gemini
  aiStatus?: 'POSITIVE' | 'WARNING' | 'NEGATIVE'; // AI Classification
}

export interface Appointment {
  id: string;
  title: string;
  type: 'Consulta Médica' | 'Exercício' | 'Exame Agendado' | 'Outro';
  date: string; // ISO string format for datetime
  notes?: string;
  contactId?: string; // Links to a Contact of type 'Médico'
  reminderEnabled?: boolean;
}

export interface HydrationRecord {
  id: string;
  date: string; // ISO string full datetime
  amount: number; // ml
  type: 'Água' | 'Suco' | 'Chá' | 'Café' | 'Água de Coco' | 'Refrigerante' | 'Outro';
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  type: 'glucose' | 'medication' | 'exam' | 'meal' | 'appointment';
  fullDate: Date;
}

export interface WeatherData {
    temperature: number;
    description: string;
    code: number;
}

export interface GlucoseAlertsConfig {
  lowEnabled: boolean;
  highEnabled: boolean;
  lowThreshold: number;
  highThreshold: number;
}

export interface DashboardConfig {
  showQuickActions: boolean;
  // New specific quick action toggles
  showQuickGlucose?: boolean;
  showQuickMeal?: boolean;
  showQuickMedication?: boolean;
  showQuickInsulin?: boolean;
  showAlerts: boolean;
  showProfileSummary: boolean;
  showHealthNews: boolean;
  showGlucoseStats: boolean;
  show7DayChart: boolean;
  showFullHistoryChart: boolean;
  showHydration: boolean;
}
