import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type { KnockoutQuestion, TipoPreguntaKnockout, ReglaPreguntaKnockout } from '@/types/ats';

interface KnockoutQuestionsTabProps {
  questions: KnockoutQuestion[];
  onChange: (questions: KnockoutQuestion[]) => void;
}

export default function KnockoutQuestionsTab({ questions, onChange }: KnockoutQuestionsTabProps) {
  const addQuestion = () => {
    const newQuestion: KnockoutQuestion = {
      id: crypto.randomUUID(),
      pregunta: '',
      tipo: 'booleano',
      regla: 'si',
      valor_referencia: '',
    };
    onChange([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<KnockoutQuestion>) => {
    onChange(
      questions.map((q) => {
        if (q.id === id) {
          const updated = { ...q, ...updates };
          // Reset rule if type changes
          if (updates.tipo) {
            updated.regla = updates.tipo === 'booleano' ? 'si' : 'minimo';
            updated.valor_referencia = updates.tipo === 'booleano' ? '' : '0';
          }
          return updated;
        }
        return q;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Preguntas Knockout</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Define preguntas que eliminarán automáticamente a los candidatos que no cumplan con los criterios establecidos.
        </p>
        <p className="text-sm font-medium text-orange-600">
          Todas las preguntas son requeridas por defecto.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="relative overflow-hidden border-orange-100">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pregunta {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Escribe la pregunta knockout..."
                  value={question.pregunta}
                  onChange={(e) => updateQuestion(question.id, { pregunta: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    value={question.tipo}
                    onValueChange={(value: TipoPreguntaKnockout) =>
                      updateQuestion(question.id, { tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de pregunta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booleano">Sí/No (Booleano)</SelectItem>
                      <SelectItem value="numerico">Numérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Regla:</Label>
                  {question.tipo === 'booleano' ? (
                    <Select
                      value={question.regla as string}
                      onValueChange={(value: ReglaPreguntaKnockout) =>
                        updateQuestion(question.id, { regla: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={question.regla as string}
                        onValueChange={(value: ReglaPreguntaKnockout) =>
                          updateQuestion(question.id, { regla: value })
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimo">Valor mínimo</SelectItem>
                          <SelectItem value="maximo">Valor máximo</SelectItem>
                          <SelectItem value="exacto">Valor exacto</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={question.valor_referencia}
                        onChange={(e) => updateQuestion(question.id, { valor_referencia: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed py-8 transition-all hover:border-primary hover:bg-primary/5"
        onClick={addQuestion}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Pregunta Knockout
      </Button>
    </div>
  );
}
