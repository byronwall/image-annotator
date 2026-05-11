import { useNavigate } from "@solidjs/router";
import { ArrowRight, Hammer, LayoutTemplate, Wrench } from "lucide-solid";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Box, Grid, HStack, VStack } from "styled-system/jsx";
import { COMPS_EXPLORER_BASE_PATH } from "~/components/comps-explorer/compsExplorer.shared";
import * as Card from "~/components/ui/card";

export default function HomeRoute() {
  const navigate = useNavigate();

  return (
    <Box minH="dvh" bg="bg.canvas" color="fg.default">
      <Box maxW="6xl" mx="auto" px={{ base: "5", md: "8" }} py={{ base: "10", md: "14" }}>
        <VStack alignItems="stretch" gap={{ base: "8", md: "10" }}>
          <VStack alignItems="start" gap="4" maxW="3xl">
            <Box
              display="inline-flex"
              alignItems="center"
              px="3"
              py="1"
              borderRadius="full"
              borderWidth="1px"
              borderColor="border"
              bg="bg.default"
              textStyle="xs"
              fontWeight="semibold"
              letterSpacing="wide"
            >
              SOLIDSTART + PANDA + PARK UI STARTER
            </Box>

            <VStack alignItems="start" gap="3">
              <Box textStyle={{ base: "4xl", md: "6xl" }} fontWeight="bold" letterSpacing="tight">
                Panda Park UI
              </Box>
              <Text textStyle="lg" color="fg.muted" maxW="2xl">
                This repository is a starter workspace for building a real SolidStart app with
                Panda CSS, Park UI wrappers, and a built-in internal component explorer for design
                system and recipe work.
              </Text>
            </VStack>

            <VStack alignItems="start" gap="3" maxW="2xl">
              <Text textStyle="md">
                The homepage is intentionally just orientation copy. It is not meant to be the
                shipped product surface. Replace this route and add your actual application routes
                under <Box as="span" fontFamily="mono" fontSize="sm">app/src/routes</Box> as soon
                as implementation starts.
              </Text>
              <Text textStyle="md" color="fg.muted">
                The component explorer still exists, but it now lives under an internal-only path
                so it reads as a development tool instead of part of the public app.
              </Text>
            </VStack>

            <HStack gap="3" flexWrap="wrap">
              <Button
                variant="solid"
                size="lg"
                onClick={() => navigate(COMPS_EXPLORER_BASE_PATH)}
              >
                Open Internal Component Explorer
                <ArrowRight />
              </Button>
            </HStack>
          </VStack>

          <Grid gridTemplateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }} gap="4">
            <Card.Root>
              <Card.Header>
                <HStack gap="3" alignItems="center">
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="10"
                    borderRadius="l2"
                    bg="blue.subtle.bg"
                    color="blue.subtle.fg"
                  >
                    <LayoutTemplate size={18} />
                  </Box>
                  <Card.Title>What This Repo Is</Card.Title>
                </HStack>
                <Card.Description>
                  A starter app shell with shared UI wrappers, design tokens, and examples for
                  building real SolidStart product surfaces.
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <HStack gap="3" alignItems="center">
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="10"
                    borderRadius="l2"
                    bg="green.subtle.bg"
                    color="green.subtle.fg"
                  >
                    <Hammer size={18} />
                  </Box>
                  <Card.Title>How To Use It</Card.Title>
                </HStack>
                <Card.Description>
                  Start building your real app immediately by replacing this landing page, adding
                  routes, and reusing the shared UI components under
                  <Box as="span" fontFamily="mono" fontSize="sm"> app/src/components/ui</Box>.
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <HStack gap="3" alignItems="center">
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="10"
                    borderRadius="l2"
                    bg="orange.subtle.bg"
                    color="orange.subtle.fg"
                  >
                    <Wrench size={18} />
                  </Box>
                  <Card.Title>What Stays Internal</Card.Title>
                </HStack>
                <Card.Description>
                  Use the explorer at
                  <Box as="span" fontFamily="mono" fontSize="sm">
                    {" "}
                    {COMPS_EXPLORER_BASE_PATH}
                  </Box>{" "}
                  for recipe previews, design-system checks, and wrapper experimentation while you
                  build the actual app elsewhere.
                </Card.Description>
              </Card.Header>
            </Card.Root>
          </Grid>
        </VStack>
      </Box>
    </Box>
  );
}
