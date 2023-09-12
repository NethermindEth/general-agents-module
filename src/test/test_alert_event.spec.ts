import { Alert, AlertEvent, EntityType, Label } from "forta-agent";
import { AlertInput } from "../utils/alert.type";
import { createAddress, createTransactionHash } from "../utils";

describe("Test AlertEvent", () => {
  let alert: Alert;
  let alertEvent: AlertEvent;
  let alertInput: AlertInput;

  beforeEach(() => {
    alertInput = getAlertInput();
    alert = createAlert(alertInput);
    alertEvent = new AlertEvent(alert);
  });

  const createAlert = (alertInput: AlertInput): Alert => {
    return Alert.fromObject(alertInput);
  };

  const getLabel = (name: string, value: string): Label => {
    return Label.fromObject({
      entityType: EntityType.Transaction,
      entity: createTransactionHash({ to: createAddress("0x1234") }),
      label: name,
      confidence: 1,
      metadata: { value: value },
    });
  };

  const getAlertInput = (): AlertInput => {
    let alertInput: AlertInput = {
      addresses: [createAddress("0x1234"), createAddress("0x5678"), createAddress("0x9abc")],
      alertId: createTransactionHash({ to: createAddress("0x1234") }),
      hash: createTransactionHash({ to: createAddress("0x45678987654") }),
      contracts: [
        { address: createAddress("0x1234"), name: "Contract1" },
        { address: createAddress("0x5678"), name: "Contract2" },
        { address: createAddress("0x9abc"), name: "Contract3" },
      ],
      createdAt: "2021-01-01T00:00:00.000Z",
      description: "Test Alert",
      findingType: "Info",
      name: "Test Alert",
      protocol: "Test",
      scanNodeCount: 1,
      severity: "Info",
      alertDocumentType: "Alert",
      relatedAlerts: [createTransactionHash({ to: createAddress("0x1234") })],
      chainId: 1,
      labels: [getLabel("label1", "value1"), getLabel("label2", "value2")],
      source: {
        transactionHash: createTransactionHash({ to: createAddress("0x1234") }),
        block: {
          timestamp: "2021-01-01T00:00:00.000Z",
          chainId: 1,
          hash: createTransactionHash({ to: createAddress("0x1234") }),
          number: 1,
        },
        bot: {
          id: "botId",
          reference: "botReference",
          image: "botImage",
        },
        sourceAlert: {
          hash: createTransactionHash({ to: createAddress("0x1234") }),
          botId: "botId",
          timestamp: "2021-01-01T00:00:00.000Z",
          chainId: 1,
        },
      },
      metadata: {
        metadata1: "value1",
        metadata2: "value2",
      },
      projects: [
        {
          id: "projectId",
          name: "projectName",
          contacts: {
            securityEmailAddress: "securityEmailAddress",
            generalEmailAddress: "generalEmailAddress",
          },
          website: "website",
          token: {
            symbol: "symbol",
            name: "name",
            decimals: 1,
            chainId: 1,
            address: createAddress("0x1234"),
          },
          social: {
            twitter: "twitter",
            github: "github",
            everest: "everest",
            coingecko: "coingecko",
          },
        },
      ],
      addressBloomFilter: {
        bitset: "bitset",
        k: "k",
        m: "m",
      },
    };

    return alertInput;
  };

  it("returns the alert with the set AlertInput values", () => {
    expect(alertEvent.alert).toEqual(alert);
  });
});
