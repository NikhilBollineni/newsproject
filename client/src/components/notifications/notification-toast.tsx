import { useEffect } from 'react';
import { AlertTriangle, TrendingUp, Info, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotifications, type Notification } from '@/hooks/use-notifications';

export default function NotificationToastProvider() {
  const { notifications } = useNotifications();

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'breaking_news':
        return AlertTriangle;
      case 'market_alert':
        return TrendingUp;
      case 'sentiment_change':
        return Info;
      default:
        return Info;
    }
  };

  const getToastVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  useEffect(() => {
    // Show toast for the most recent unread notification
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      const latest = unreadNotifications[0];
      const Icon = getToastIcon(latest.type);
      
      toast({
        title: latest.title,
        description: latest.message,
        variant: getToastVariant(latest.priority),
        duration: latest.priority === 'high' ? 8000 : 5000, // High priority notifications stay longer
      });
    }
  }, [notifications]);

  return null; // This component doesn't render anything, it just manages toasts
}