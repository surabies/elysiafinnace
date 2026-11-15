"use client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MyAppProps {
  children: React.ReactNode;
  className?: string;
}
const CardBox: React.FC<MyAppProps> = ({ children, className }) => {
  return (
    <Card className={cn("card border border-border rounded-md", className)}>
      {children}
    </Card>
  );
};

export default CardBox;
