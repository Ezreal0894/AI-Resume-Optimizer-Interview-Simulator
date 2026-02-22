import React from 'react';

export type ViewState = 'dashboard' | 'resume' | 'interview' | 'reports' | 'documents' | 'settings';

export interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ElementType;
}
