import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-muted-foreground max-w-md">{description}</p>
          </div>
          {actionLabel && onAction && (
            <Button onClick={onAction} size="lg" className="mt-4">
              {actionLabel}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
