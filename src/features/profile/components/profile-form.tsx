"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { Input, Textarea } from "@/design-system/components/input";
import { Select } from "@/design-system/components/select";
import { Card, CardHeader, CardTitle, CardDescription } from "@/design-system/components/card";
import { Avatar } from "@/design-system/components/avatar";
import { BRAZILIAN_STATES } from "@/domains/profile/contracts";
import type { FullProfile, SelectOption } from "@/domains/profile/contracts";
import { CheckboxGroup } from "./checkbox-group";

type ProfileFormProps = Readonly<{
  profile: FullProfile;
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  selectedSubjectIds: string[];
  selectedGradeLevelIds: string[];
}>;

const stateOptions = BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }));

export function ProfileForm({
  profile,
  subjects,
  gradeLevels,
  selectedSubjectIds: initialSubjectIds,
  selectedGradeLevelIds: initialGradeLevelIds,
}: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [schools, setSchools] = useState(profile.schools ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile.years_experience?.toString() ?? "",
  );
  const [academicBackground, setAcademicBackground] = useState(
    profile.academic_background ?? "",
  );
  const [subjectIds, setSubjectIds] = useState<string[]>(initialSubjectIds);
  const [gradeLevelIds, setGradeLevelIds] = useState<string[]>(initialGradeLevelIds);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.replace(/\D/g, ""),
          bio: bio.trim(),
          state,
          city: city.trim(),
          schools: schools.trim(),
          years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
          academic_background: academicBackground.trim(),
          subject_ids: subjectIds,
          grade_level_ids: gradeLevelIds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Erro ao salvar perfil.");
      }

      toast.success("Perfil salvo com sucesso!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar perfil.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Card 1: Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informacoes basicas do seu perfil</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile.full_name ?? "Professor"}
              src={profile.avatar_url ?? undefined}
              size="lg"
            />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-text-primary">
                {profile.full_name ?? "Professor"}
              </p>
              <p className="text-xs text-text-muted">{profile.email}</p>
            </div>
          </div>

          <Input
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />

          <Input
            label="Telefone / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            disabled={isSubmitting}
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Conte um pouco sobre voce e sua atuacao..."
            disabled={isSubmitting}
            hint={`${bio.length}/500`}
          />
        </div>
      </Card>

      {/* Card 2: Localizacao */}
      <Card>
        <CardHeader>
          <CardTitle>Localizacao</CardTitle>
          <CardDescription>Onde voce atua</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <Select
            label="Estado"
            value={state}
            onChange={(e) => setState(e.target.value)}
            options={stateOptions}
            placeholder="Selecione um estado"
            disabled={isSubmitting}
          />

          <Input
            label="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            placeholder="Digite sua cidade"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      {/* Card 3: Atuacao Profissional */}
      <Card>
        <CardHeader>
          <CardTitle>Atuacao Profissional</CardTitle>
          <CardDescription>Detalhes sobre sua carreira e atuacao</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <Textarea
            label="Escolas onde atua"
            value={schools}
            onChange={(e) => setSchools(e.target.value)}
            maxLength={500}
            placeholder="Informe as escolas onde voce leciona"
            disabled={isSubmitting}
          />

          <CheckboxGroup
            label="Materias que leciona"
            options={subjects}
            selectedIds={subjectIds}
            onChange={setSubjectIds}
            disabled={isSubmitting}
          />

          <CheckboxGroup
            label="Niveis de ensino"
            options={gradeLevels}
            selectedIds={gradeLevelIds}
            onChange={setGradeLevelIds}
            disabled={isSubmitting}
          />

          <Input
            label="Anos de experiencia"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="Ex: 5"
            disabled={isSubmitting}
          />

          <Input
            label="Formacao academica"
            value={academicBackground}
            onChange={(e) => setAcademicBackground(e.target.value)}
            maxLength={200}
            placeholder="Ex: Licenciatura em Matematica"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
