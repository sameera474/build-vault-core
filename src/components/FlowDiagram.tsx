import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FlowDiagram() {
  // Initialize Mermaid when component mounts
  React.useEffect(() => {
    const initMermaid = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Dynamically import mermaid
          const mermaid = await import('mermaid');
          mermaid.default.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          });
          
          // Re-render diagrams
          mermaid.default.contentLoaded();
        } catch (error) {
          console.warn('Mermaid not available, showing static diagram');
        }
      }
    };

    initMermaid();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Report Process Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div 
            className="mermaid min-h-[400px]" 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontSize: '14px'
            }}
          >
            {`
flowchart TD
    A[Select Project] --> B[Choose Material<br/>Soil/Concrete/Aggregates/Asphalt or Custom]
    B --> C[Enter Road Details<br/>Road Name, Chainage From–To<br/>Side, Lab Test No., Covered Chainage, Offset]
    C --> D[Select Test Type<br/>e.g., Proctor, Field Density, CBR]
    D --> E[Open Excel-like Editor<br/>Template, Formulas, Validation, Charts]
    E --> F[Save Draft]
    E --> G[Submit for Approval]
    G --> H{Quality Manager Review}
    H -->|Approve| I{Consultant Approval<br/>if required}
    H -->|Reject| E
    I -->|Approve| J[Approved ✓<br/>Update Chainage View<br/>Eligible for Monthly Summary]
    I -->|Reject| E
    F --> E

    style A fill:#e1f5fe
    style J fill:#e8f5e8
    style H fill:#fff3e0
    style I fill:#fff3e0
            `}
          </div>
        </div>
        
        <div className="mt-6 space-y-3 text-sm">
          <h4 className="font-medium">Process Overview:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-primary">Creation Phase</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Select project and material type</li>
                <li>Enter road details and location</li>
                <li>Choose appropriate test type</li>
                <li>Use Excel-like editor with templates</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-primary">Approval Workflow</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Submit report for Quality Manager review</li>
                <li>QM can approve or reject with comments</li>
                <li>Consultant approval for final sign-off</li>
                <li>Approved reports update chainage data</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}