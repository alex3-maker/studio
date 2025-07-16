
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { Eye, EyeOff, Bot, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function AdminSettingsPage() {
  const { apiKey, setApiKey, isAiEnabled, setIsAiEnabled } = useAppContext();
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (apiKey) {
      setCurrentApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSaveKey = () => {
    setApiKey(currentApiKey);
    toast({
      title: '¡Clave Guardada!',
      description: 'La clave de API se ha guardado correctamente.',
    });
  };

  const handleToggleAI = (enabled: boolean) => {
    setIsAiEnabled(enabled);
    toast({
        title: `IA ${enabled ? 'Activada' : 'Desactivada'}`,
        description: `Las funciones de inteligencia artificial han sido ${enabled ? 'habilitadas' : 'deshabilitadas'} en toda la aplicación.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2"><Settings />Ajustes de IA</CardTitle>
        <CardDescription>
          Gestiona la integración con Inteligencia Artificial, como la clave de API y la activación global de sus funciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
                <Label htmlFor="ai-switch" className="text-base font-semibold flex items-center gap-2">
                    <Bot />
                    Activar Funciones de IA
                </Label>
                <p className="text-sm text-muted-foreground">
                    Controla si los botones y funciones de IA están visibles y operativos en la aplicación.
                </p>
            </div>
             <Switch
                id="ai-switch"
                checked={isAiEnabled}
                onCheckedChange={handleToggleAI}
            />
        </div>

        <Separator />
        
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
              disabled={!isAiEnabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={!isAiEnabled}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tu clave se guardará de forma segura en el almacenamiento local de tu navegador.
          </p>
        </div>
        <Button onClick={handleSaveKey} disabled={!isAiEnabled}>Guardar Clave</Button>
      </CardContent>
    </Card>
  );
}
