export interface UserProfile {
  name: string;
  age: string;
  weight: string;
  height: string;
  diabetesType: 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'Outro';
  photo?: string;
  allergies?: string[];
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
}

export interface Contact {
  id: string;
  name: string;
  type: 'Médico' | 'Familiar' | 'Emergência' | 'Clínica' | 'Hospital' | 'Laboratório' | 'Outro';
  phone: string;
  email?: string;
  specialty?: string;
  photo?: string;
  workplaceIds?: string[];
}

export interface Exam {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  result: string;
  unit?: string;
  reminderEnabled?: boolean;
  reminderConfig?: {
    type: 'daysBefore' | 'specificDate';
    value: number | string; // number for days, string for date YYYY-MM-DD
  };
  laboratoryId?: string;
  completed?: boolean;
}

export interface Meal {
  id: string;
  type: 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche';
  date: string;
  description: string;
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
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
  showAlerts: boolean;
  showProfileSummary: boolean;
  showGlucoseStats: boolean;
  show7DayChart: boolean;
  showFullHistoryChart: boolean;
}