import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { ProviderProvider } from './ProviderContext';
import { EarningsProvider } from './EarningsContext';
import { AdminProvider } from './AdminContext';
import { JobProvider } from './JobContext';
import { MessageProvider } from './MessageContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProviderProvider>
          <EarningsProvider>
            <AdminProvider>
              <JobProvider>
                <MessageProvider>
                  {children}
                </MessageProvider>
              </JobProvider>
            </AdminProvider>
          </EarningsProvider>
        </ProviderProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
