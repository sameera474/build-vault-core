import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AggregateImpactValueTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function AggregateImpactValueTest({ data, onUpdate }: AggregateImpactValueTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || '',
    dateOfTesting: data.dateOfTesting || '',
    testedBy: data.testedBy || '',
    sampleWeight: data.sampleWeight || '',
    weightPassing2_36mm: data.weightPassing2_36mm || '',
    weightRetained2_36mm: data.weightRetained2_36mm || '',
    hammerWeight: data.hammerWeight || '13.5', // kg for standard hammer
    noOfBlows: data.noOfBlows || '15',
    weightAfterImpact: data.weightAfterImpact || '',
    weightPassing2_36mmAfterImpact: data.weightPassing2_36mmAfterImpact || '',
    weightRetained2_36mmAfterImpact: data.weightRetained2_36mmAfterImpact || '',
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const calculateAggregateImpactValue = () => {
    const sampleWeight = parseFloat(formData.sampleWeight);
    const weightRetained2_36mm = parseFloat(formData.weightRetained2_36mm);
    const weightRetained2_36mmAfterImpact = parseFloat(formData.weightRetained2_36mmAfterImpact);

    if (!sampleWeight || !weightRetained2_36mm || !weightRetained2_36mmAfterImpact) {
      return 'Insufficient data';
    }

    // AIV = [(W1 - W2) / W1] × 100
    // Where W1 = weight retained on 2.36mm sieve before impact
    // W2 = weight retained on 2.36mm sieve after impact

    const impactValue = ((weightRetained2_36mm - weightRetained2_36mmAfterImpact) / weightRetained2_36mm) * 100;
    return impactValue.toFixed(2);
  };

  const calculatePercentageFines = () => {
    const sampleWeight = parseFloat(formData.sampleWeight);
    const weightAfterImpact = parseFloat(formData.weightAfterImpact);

    if (!sampleWeight || !weightAfterImpact) {
      return '0.00';
    }

    const fines = ((sampleWeight - weightAfterImpact) / sampleWeight) * 100;
    return fines.toFixed(2);
  };

  const aiv = calculateAggregateImpactValue();
  const percentageFines = calculatePercentageFines();

  const getClassification = (aivValue: number) => {
    if (aivValue <= 10) return 'Exceptionally Strong';
    if (aivValue <= 20) return 'Strong';
    if (aivValue <= 30) return 'Satisfactory for Road Surfacing';
    if (aivValue <= 45) return 'Weak for Road Surfacing';
    return 'Unsuitable for Road Surfacing';
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sampleDescription">Sample Description</Label>
              <Textarea
                id="sampleDescription"
                value={formData.sampleDescription}
                onChange={(e) => updateFormData('sampleDescription', e.target.value)}
                placeholder="Describe the aggregate sample"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="dateOfTesting">Date of Testing</Label>
              <Input
                id="dateOfTesting"
                type="date"
                value={formData.dateOfTesting}
                onChange={(e) => updateFormData('dateOfTesting', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="testedBy">Tested By</Label>
              <Input
                id="testedBy"
                value={formData.testedBy}
                onChange={(e) => updateFormData('testedBy', e.target.value)}
                placeholder="Name of technician"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="hammerWeight">Hammer Weight (kg)</Label>
              <Input
                id="hammerWeight"
                value={formData.hammerWeight}
                onChange={(e) => updateFormData('hammerWeight', e.target.value)}
                placeholder="13.5"
              />
            </div>
            <div>
              <Label htmlFor="noOfBlows">Number of Blows</Label>
              <Input
                id="noOfBlows"
                value={formData.noOfBlows}
                onChange={(e) => updateFormData('noOfBlows', e.target.value)}
                placeholder="15"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Preparation */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Preparation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sampleWeight">Total Sample Weight (g)</Label>
              <Input
                id="sampleWeight"
                type="number"
                value={formData.sampleWeight}
                onChange={(e) => updateFormData('sampleWeight', e.target.value)}
                placeholder="500"
              />
            </div>
            <div>
              <Label htmlFor="weightPassing2_36mm">Weight Passing 2.36mm (g)</Label>
              <Input
                id="weightPassing2_36mm"
                type="number"
                value={formData.weightPassing2_36mm}
                onChange={(e) => updateFormData('weightPassing2_36mm', e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="weightRetained2_36mm">Weight Retained on 2.36mm (g)</Label>
              <Input
                id="weightRetained2_36mm"
                type="number"
                value={formData.weightRetained2_36mm}
                onChange={(e) => updateFormData('weightRetained2_36mm', e.target.value)}
                placeholder="450"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weightAfterImpact">Weight After Impact (g)</Label>
              <Input
                id="weightAfterImpact"
                type="number"
                value={formData.weightAfterImpact}
                onChange={(e) => updateFormData('weightAfterImpact', e.target.value)}
                placeholder="485"
              />
            </div>
            <div>
              <Label htmlFor="weightPassing2_36mmAfterImpact">Weight Passing 2.36mm After Impact (g)</Label>
              <Input
                id="weightPassing2_36mmAfterImpact"
                type="number"
                value={formData.weightPassing2_36mmAfterImpact}
                onChange={(e) => updateFormData('weightPassing2_36mmAfterImpact', e.target.value)}
                placeholder="75"
              />
            </div>
            <div>
              <Label htmlFor="weightRetained2_36mmAfterImpact">Weight Retained on 2.36mm After Impact (g)</Label>
              <Input
                id="weightRetained2_36mmAfterImpact"
                type="number"
                value={formData.weightRetained2_36mmAfterImpact}
                onChange={(e) => updateFormData('weightRetained2_36mmAfterImpact', e.target.value)}
                placeholder="410"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Impact Value Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Aggregate Impact Value (AIV)</h4>
              <p className="text-3xl font-mono text-blue-800">{aiv}%</p>
              <p className="text-sm text-blue-700 mt-1">
                Impact resistance of aggregate
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Percentage Fines</h4>
              <p className="text-3xl font-mono text-green-800">{percentageFines}%</p>
              <p className="text-sm text-green-700 mt-1">
                Material broken during test
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">Aggregate Classification</h4>
            <div className="text-gray-800">
              {parseFloat(aiv) !== 0 && (
                <p className="text-lg font-medium">{getClassification(parseFloat(aiv))}</p>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">AIV Classification Standards</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• AIV ≤ 10%: Exceptionally strong aggregate</li>
              <li>• AIV 10-20%: Strong aggregate</li>
              <li>• AIV 20-30%: Satisfactory for road surfacing</li>
              <li>• AIV 30-45%: Weak for road surfacing</li>
              <li>• AIV greater than 45%: Unsuitable for road surfacing</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">Test Method Notes</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Sample size: 350-400g retained on 2.36mm sieve</li>
              <li>• Hammer: 13.5kg dropped from 380mm height</li>
              <li>• Number of blows: 15</li>
              <li>• Test measures toughness/impact resistance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}