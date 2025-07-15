
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSettingsPage() {
  const { apiKey, setApiKey } = useAppContext();
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (apiKey) {
      setCurrentApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSave = () => {
    setApiKey(currentApiKey);
    toast({
      title: '¡Clave Guardada!',
      description: 'La clave de API se ha guardado correctamente.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Ajustes de IA</CardTitle>
        <CardDescription>
          Gestiona la configuración de la integración con la Inteligencia Artificial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="api-key">Clave de API de Google Gemini</Label>
          <div className="relative mt-2">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={currentApiKey}
              onChange={(e) => setCurrentApiKey(e.target.value)}
              placeholder="Introduce tu clave de API aquí"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tu clave se guardará de forma segura en el almacenamiento local de tu navegador.
          </p>
        </div>
        <Button onClick={handleSave}>Guardar Clave</Button>
      </CardContent>
    </Card>
  );
}
