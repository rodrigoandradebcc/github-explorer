import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  GlassView,
  Heading,
  Input,
  Skeleton,
  Switch,
  Text,
  useTheme,
} from '@/design-system';
import type {
  AvatarSize,
  BadgeSize,
  BadgeTone,
  ButtonSize,
  ButtonVariant,
  CardPadding,
  ColorKey,
  SpacingKey,
} from '@/design-system';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Box direction="column" gap="md">
      <Box direction="column" gap="xs">
        <Heading level={2}>{title}</Heading>
        <View style={{ height: 1, backgroundColor: colors.border }} />
      </Box>
      {children}
    </Box>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="label" size="xs" tone="muted">
      {children}
    </Text>
  );
}

const toneLabels: Record<BadgeTone, string> = {
  default: 'PADRÃO',
  success: 'SUCESSO',
  warning: 'AVISO',
  danger: 'PERIGO',
  info: 'INFO',
};

const variantLabels: Record<ButtonVariant, string> = {
  primary: 'PRIMÁRIO',
  outline: 'CONTORNO',
  ghost: 'FANTASMA',
};

export default function ShowcaseScreen() {
  const { colors, spacing, radius, mode, toggleMode } = useTheme();
  const [controlled, setControlled] = useState('');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Design System',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: '',
        }}
      />
      <ScrollView>
        <Box padding="md" direction="column" gap="xl" paddingBottom="xl">
          <Section title="Tema">
            <Card>
              <Box direction="row" align="center" justify="space-between">
                <Box direction="column" gap="xs">
                  <Text weight="medium">Modo de cor</Text>
                  <Text tone="muted" size="sm">
                    {mode === 'light' ? 'Claro' : 'Escuro'}
                  </Text>
                </Box>
                <Switch value={mode === 'dark'} onValueChange={toggleMode} />
              </Box>
            </Card>
          </Section>

          <Section title="Cores">
            <Box direction="column" gap="sm">
              {(Object.entries(colors) as [ColorKey, string][]).map(([key, value]) => (
                <Box key={key} direction="row" align="center" gap="md">
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radius.md,
                      backgroundColor: value,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                  <Box direction="column" gap="xs" flex={1}>
                    <Text weight="medium">{key}</Text>
                    <Text tone="muted" size="xs">
                      {value.toUpperCase()}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>

          <Section title="Espaçamento">
            <Box direction="column" gap="sm">
              {(Object.entries(spacing) as [SpacingKey, number][]).map(([key, value]) => (
                <Box key={key} direction="row" align="center" gap="md">
                  <View
                    style={{
                      width: value * 5,
                      height: 20,
                      borderRadius: radius.sm,
                      backgroundColor: colors.primary,
                      opacity: 0.7,
                    }}
                  />
                  <Text tone="muted" size="sm">
                    {key} — {value}px
                  </Text>
                </Box>
              ))}
            </Box>
          </Section>

          <Section title="Tipografia">
            <Box direction="column" gap="lg">
              <Box direction="column" gap="xs">
                <Label>TÍTULOS</Label>
                <Heading level={1}>Título 1 — xl</Heading>
                <Heading level={2}>Título 2 — lg</Heading>
                <Heading level={3}>Título 3 — md</Heading>
              </Box>

              <Box direction="column" gap="xs">
                <Label>TAMANHOS</Label>
                <Text size="xl">xl — 28px</Text>
                <Text size="lg">lg — 20px</Text>
                <Text size="md">md — 16px (padrão)</Text>
                <Text size="sm">sm — 14px</Text>
                <Text size="xs">xs — 12px</Text>
              </Box>

              <Box direction="column" gap="xs">
                <Label>VARIANTES</Label>
                <Text variant="body">Corpo — texto corrido padrão</Text>
                <Text variant="caption">Legenda — informação secundária</Text>
                <Text variant="label">Rótulo — metadado em maiúsculas</Text>
              </Box>

              <Box direction="column" gap="xs">
                <Label>PESOS</Label>
                <Text weight="regular">Regular 400</Text>
                <Text weight="medium">Médio 500</Text>
                <Text weight="bold">Negrito 700</Text>
              </Box>

              <Box direction="column" gap="xs">
                <Label>TONS</Label>
                <Text tone="default">Padrão — conteúdo principal</Text>
                <Text tone="muted">Atenuado — conteúdo secundário</Text>
                <Text tone="danger">Perigo — erros e alertas</Text>
                <Text tone="success">Sucesso — retorno positivo</Text>
              </Box>
            </Box>
          </Section>

          <Section title="Botões">
            <Box direction="column" gap="md">
              {(['primary', 'outline', 'ghost'] as ButtonVariant[]).map((variant) => (
                <Box key={variant} direction="column" gap="xs">
                  <Label>{variantLabels[variant]}</Label>
                  <Box direction="row" align="center" gap="sm">
                    {(['sm', 'md', 'lg'] as ButtonSize[]).map((size) => (
                      <Button key={size} variant={variant} size={size} onPress={() => {}}>
                        {size}
                      </Button>
                    ))}
                  </Box>
                </Box>
              ))}

              <Box direction="column" gap="xs">
                <Label>ESTADOS</Label>
                <Box direction="row" align="center" gap="sm">
                  <Button loading onPress={() => {}}>
                    Carregando
                  </Button>
                  <Button disabled onPress={() => {}}>
                    Desabilitado
                  </Button>
                </Box>
              </Box>
            </Box>
          </Section>

          <Section title="Campos">
            <Box direction="column" gap="md">
              <Input label="Vazio" value="" onChangeText={() => {}} placeholder="Placeholder…" />
              <Input label="Com valor" value="facebook/react" onChangeText={() => {}} />
              <Input
                label="Estado de erro"
                value="nome@inválido"
                onChangeText={() => {}}
                error="Nome do repositório não pode conter @"
              />
              <Input
                label="Texto auxiliar (interativo)"
                value={controlled}
                onChangeText={setControlled}
                placeholder="ex.: torvalds"
                helperText="Digite um usuário ou organização do GitHub"
              />
              <Input
                label="Desabilitado"
                value="valor somente leitura"
                onChangeText={() => {}}
                disabled
              />
            </Box>
          </Section>

          <Section title="Cards">
            <Box direction="column" gap="sm">
              {(['sm', 'md', 'lg'] as CardPadding[]).map((p) => (
                <Card key={p} padding={p}>
                  <Box direction="row" align="center" justify="space-between">
                    <Text weight="medium">{`padding="${p}"`}</Text>
                    <Badge tone="default" size="sm">
                      {spacing[p]}px
                    </Badge>
                  </Box>
                </Card>
              ))}
            </Box>
          </Section>

          <Section title="Badges">
            <Box direction="column" gap="sm">
              {(['default', 'success', 'warning', 'danger', 'info'] as BadgeTone[]).map((tone) => (
                <Box key={tone} direction="column" gap="xs">
                  <Label>{toneLabels[tone]}</Label>
                  <Box direction="row" align="center" gap="sm">
                    {(['sm', 'md'] as BadgeSize[]).map((size) => (
                      <Badge key={size} tone={tone} size={size}>
                        {toneLabels[tone].toLowerCase()} · {size}
                      </Badge>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>

          <Section title="Avatares">
            <Box direction="column" gap="md">
              <Box direction="column" gap="xs">
                <Label>COM URI — p / m / g</Label>
                <Box direction="row" align="center" gap="md">
                  {(['sm', 'md', 'lg'] as AvatarSize[]).map((size) => (
                    <Avatar
                      key={size}
                      uri="https://avatars.githubusercontent.com/u/69631?v=4"
                      fallback="FB"
                      size={size}
                    />
                  ))}
                </Box>
              </Box>
              <Box direction="column" gap="xs">
                <Label>APENAS FALLBACK — p / m / g</Label>
                <Box direction="row" align="center" gap="md">
                  {(['sm', 'md', 'lg'] as AvatarSize[]).map((size) => (
                    <Avatar key={size} fallback="Rodrigo" size={size} />
                  ))}
                </Box>
              </Box>
            </Box>
          </Section>

          <Section title="Skeletons">
            <Card>
              <Box direction="column" gap="sm">
                <Box direction="row" align="center" gap="sm">
                  <Skeleton width={48} height={48} radius="lg" />
                  <Box direction="column" gap="xs" flex={1}>
                    <Skeleton width="40%" height={12} />
                    <Skeleton width="70%" height={18} />
                  </Box>
                </Box>
                <Skeleton width="100%" height={14} />
                <Skeleton width="85%" height={14} />
                <Box direction="row" gap="sm">
                  <Skeleton width={64} height={22} radius="lg" />
                  <Skeleton width={50} height={22} radius="sm" />
                </Box>
              </Box>
            </Card>
          </Section>

          <Section title="Vidro">
            <Box direction="column" gap="md">
              <Text tone="muted" size="sm">
                Superfície translúcida das barras fixas da busca. No iOS é desfoque real via
                `expo-blur`; nas demais plataformas, camada sólida com opacidade.
              </Text>

              {([20, 60, 100] as const).map((intensity) => (
                <Box key={intensity} direction="column" gap="xs">
                  <Label>{`INTENSITY ${intensity}`}</Label>
                  <View style={{ height: 96, borderRadius: radius.md, overflow: 'hidden' }}>
                    <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
                      {[colors.primary, colors.success, colors.warning, colors.danger].map((c) => (
                        <View key={c} style={{ flex: 1, backgroundColor: c }} />
                      ))}
                    </View>
                    <GlassView
                      intensity={intensity}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: spacing.sm,
                      }}
                    >
                      <Text weight="medium">GlassView</Text>
                    </GlassView>
                  </View>
                </Box>
              ))}
            </Box>
          </Section>
        </Box>
      </ScrollView>
    </>
  );
}
