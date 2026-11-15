import { expect, test } from "@playwright/test";

type SciencePurchase = {
  name: string;
  quantity: number;
};

type MissionScenario = {
  name: string;
  code: string;
  color: string;
  purchases: SciencePurchase[];
  shipOptions?: Partial<Record<number, string>>;
};

const buildSteps = [
  "Veículo de lançamento",
  "Sistema de propulsão",
  "Geração de energia",
  "Proteção da carga",
  "Navegação e comunicação",
];

const missions: MissionScenario[] = [
  {
    name: "Pulso Orbital",
    code: "MISSÃO 01",
    color: "cyan",
    purchases: [{ name: "Monitor de qualidade do ar", quantity: 2 }],
  },
  {
    name: "Eco Lunar",
    code: "MISSÃO 02",
    color: "violet",
    purchases: [
      { name: "Detector de nêutrons lunares", quantity: 1 },
      { name: "Radiômetro térmico lunar", quantity: 1 },
    ],
  },
  {
    name: "Horizonte Rubro",
    code: "MISSÃO 03",
    color: "orange",
    purchases: [{ name: "Analisador ambiental marciano", quantity: 2 }],
  },
  {
    name: "Oceano Silencioso",
    code: "MISSÃO 04",
    color: "blue",
    purchases: [
      { name: "Espectrômetro infravermelho", quantity: 1 },
      { name: "Radar de penetração no gelo", quantity: 1 },
    ],
    shipOptions: {
      1: "Propulsão iônica",
      3: "Manta multicamada",
      4: "GPS orbital",
    },
  },
  {
    name: "Retorno Bennu",
    code: "MISSÃO 05",
    color: "pink",
    purchases: [{ name: "Espectrômetro de amostras", quantity: 2 }],
    shipOptions: {
      1: "Propulsão iônica",
      3: "Manta multicamada",
      4: "GPS orbital",
    },
  },
];

test("completa todas as missões da campanha com sucesso", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar partida" }).click();
  await page.getByRole("button", { name: "Escolher missão" }).click();

  for (const [missionIndex, mission] of missions.entries()) {
    await page.getByRole("button", { name: `Selecionar missão ${mission.name}` }).click();
    await expect(page.getByText(mission.code, { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Montar a nave" }).click();

    for (const [stepIndex, stepHeading] of buildSteps.entries()) {
      await expect(page.getByRole("heading", { name: stepHeading })).toBeVisible();
      const option = mission.shipOptions?.[stepIndex];
      if (option) {
        await page.getByRole("button", { name: option, exact: false }).click();
      }
      await page.locator(".bottom-actions .next-action").click();
    }

    await page.getByRole("button", { name: "Comprar itens" }).click();
    const catalog = page.getByRole("region", {
      name: "Instrumentos para comprar",
    });
    for (const purchase of mission.purchases) {
      await catalog.getByRole("button", { name: purchase.name, exact: false }).click();
      const addToCart = page.getByRole("button", {
        name: /^Adicionar ao carrinho/,
      });
      for (let unit = 0; unit < purchase.quantity; unit += 1) {
        await addToCart.click();
      }
    }
    await page.getByRole("button", { name: "Finalizar compra" }).click();

    for (const purchase of mission.purchases) {
      const addToMission = page.getByRole("button", {
        name: `Adicionar ${purchase.name} à missão`,
      });
      for (let unit = 0; unit < purchase.quantity; unit += 1) {
        await addToMission.click();
      }
    }

    await page.getByRole("button", { name: "Revisar missão" }).click();
    await expect(page.locator(".board-status")).toHaveAttribute("data-ready", "true");
    await expect(page.getByText("Projeto aprovado", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Lançar missão" }).click();

    const launchAnimation = page.locator(".lunar-intro");
    await expect(launchAnimation).toBeVisible();
    await expect(launchAnimation).toHaveAttribute("data-color", mission.color);

    const isFinalMission = missionIndex === missions.length - 1;
    await expect(
      page.getByRole("heading", {
        name: isFinalMission ? "A jornada está completa!" : "Missão concluída",
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: isFinalMission
          ? "Desbloquear conquista e ir para tela inicial"
          : "Receber recompensa e continuar",
      })
      .click();

    if (!isFinalMission) {
      const nextMission = missions[missionIndex + 1];
      await expect(
        page.getByRole("button", {
          name: `Selecionar missão ${nextMission.name}`,
        }),
      ).toBeVisible();
    }
  }

  await expect(page.getByText("Todas as missões concluídas")).toBeVisible();
});
