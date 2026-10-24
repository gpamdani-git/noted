/**
 * Database Property Types - Notion Parity
 * Based on PRD 02 requirements
 */

import {
  Type,
  Hash,
  Circle,
  Tag,
  Calendar,
  CheckSquare,
  Link as LinkIcon,
  Mail,
  Phone,
  User,
  Files,
  Calculator,
  Clock,
  GitBranch,
  UserCheck,
  Hash as IdIcon
} from 'lucide-react';

export const PROPERTY_TYPES = [
  { id: 'text', label: 'Text', icon: Type, description: 'Plain text notes and descriptions', category: 'basic' },
  { id: 'number', label: 'Number', icon: Hash, description: 'Numeric values with formatting', category: 'basic' },
  { id: 'select', label: 'Select', icon: Circle, description: 'One value out of a list', category: 'basic' },
  { id: 'multi_select', label: 'Multi-select', icon: Tag, description: 'Multiple tags and categories', category: 'basic' },
  { id: 'status', label: 'Status', icon: CheckSquare, description: 'Track progress with stages', category: 'basic' },
  { id: 'date', label: 'Date', icon: Calendar, description: 'Dates, deadlines, and reminders', category: 'basic' },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Simple boolean toggle', category: 'basic' },
  { id: 'url', label: 'URL', icon: LinkIcon, description: 'Clickable links and websites', category: 'basic' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Email address with mail link', category: 'basic' },
  { id: 'phone', label: 'Phone', icon: Phone, description: 'Phone number with dial link', category: 'basic' },
  { id: 'people', label: 'People', icon: User, description: 'Assign people to pages', category: 'basic' },
  { id: 'files', label: 'Files & media', icon: Files, description: 'File uploads and attachments', category: 'basic' },
  { id: 'relation', label: 'Relation', icon: GitBranch, description: 'Link to pages in another database', category: 'advanced' },
  { id: 'rollup', label: 'Rollup', icon: Calculator, description: 'Summarize related pages', category: 'advanced' },
  { id: 'formula', label: 'Formula', icon: Calculator, description: 'Compute values from properties', category: 'advanced' },
  { id: 'created_time', label: 'Created time', icon: Clock, description: 'When the page was created', category: 'auto' },
  { id: 'created_by', label: 'Created by', icon: UserCheck, description: 'Who created the page', category: 'auto' },
  { id: 'last_edited_time', label: 'Last edited time', icon: Clock, description: 'When the page was last edited', category: 'auto' },
  { id: 'last_edited_by', label: 'Last edited by', icon: UserCheck, description: 'Who last edited the page', category: 'auto' },
  { id: 'id', label: 'ID', icon: IdIcon, description: 'Auto-generated unique ID', category: 'auto' }
];

export const PROPERTY_CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'auto', label: 'Automatically generated' }
];

export const NUMBER_FORMATS = [
  { id: 'number', label: 'Number' },
  { id: 'percent', label: 'Percent' },
  { id: 'dollar', label: 'Dollar' },
  { id: 'euro', label: 'Euro' },
  { id: 'yen', label: 'Yen' },
  { id: 'pound', label: 'Pound' }
];

export const DATE_FORMATS = [
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { id: 'Month DD, YYYY', label: 'Month DD, YYYY' },
  { id: 'DD Month YYYY', label: 'DD Month YYYY' }
];

export const ROLLUP_FUNCTIONS = [
  { id: 'count_all', label: 'Count all' },
  { id: 'count_values', label: 'Count values' },
  { id: 'count_unique_values', label: 'Count unique values' },
  { id: 'count_empty', label: 'Count empty' },
  { id: 'count_not_empty', label: 'Count not empty' },
  { id: 'percent_empty', label: 'Percent empty' },
  { id: 'percent_not_empty', label: 'Percent not empty' },
  { id: 'sum', label: 'Sum' },
  { id: 'average', label: 'Average' },
  { id: 'median', label: 'Median' },
  { id: 'min', label: 'Min' },
  { id: 'max', label: 'Max' },
  { id: 'range', label: 'Range' },
  { id: 'earliest_date', label: 'Earliest date' },
  { id: 'latest_date', label: 'Latest date' },
  { id: 'date_range', label: 'Date range' },
  { id: 'show_original', label: 'Show original' }
];

export function getPropertyType(id) {
  return PROPERTY_TYPES.find(t => t.id === id) || PROPERTY_TYPES[0];
}

export default PROPERTY_TYPES;
