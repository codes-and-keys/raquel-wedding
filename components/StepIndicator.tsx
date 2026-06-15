interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                  ? 'bg-primary/15 text-primary border-2 border-primary/50'
                  : 'bg-muted text-muted-foreground/50'
              }`}
            >
              {isCompleted ? '✓' : step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-10 h-0.5 mx-1 transition-all duration-500 ${
                  step < currentStep ? 'bg-primary/60' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
