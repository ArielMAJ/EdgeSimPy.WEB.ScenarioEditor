/**
 * Utility functions for generating random items
 */

export const generateGridCoordinates = (
  gridWidth: number = 100,
  gridHeight: number = 100
): Array<[number, number]> => {
  const coordinates: Array<[number, number]> = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      coordinates.push([x, y]);
    }
  }
  return coordinates;
};

export const randomString = (
  length: number = 8,
  prefix: string = ""
): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomFloat = (
  min: number,
  max: number,
  decimals: number = 2
): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

export const randomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

export const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Context for item generation - provides access to existing items
 */
export interface GenerationContext {
  existingItems: Record<string, any[]>;
  getRandomId: (itemType: string) => number | null;
  getRandomIds: (itemType: string, count?: number) => number[];
}

/**
 * EdgeSimPy specific generators
 */

export const generateRandomNetworkSwitch = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const gridSize = 100;
  const x = (index % gridSize) * 2;
  const y = Math.floor(index / gridSize) * 2;

  const baseStationId = context?.getRandomId("BaseStation") ?? index;

  return {
    attributes: {
      id: index,
      coordinates: [x, y],
      active: true,
      power_model_parameters: {
        chassis_power: 60,
        ports_power_consumption: {
          "125": 1,
          "12.5": 0.3,
        },
      },
    },
    relationships: {
      power_model: "ConteratoNetworkPowerModel",
      edge_servers: [],
      links: [],
      base_station: {
        class: "BaseStation",
        id: baseStationId,
      },
    },
  };
};

export const generateRandomNetworkLink = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const switchIds = context?.getRandomIds("NetworkSwitch", 2) ?? [];
  if (switchIds.length < 2) {
    console.warn(
      `Cannot generate NetworkLink ${index}: need at least 2 NetworkSwitches, found ${switchIds.length}`
    );
    return null as any;
  }
  const switch1 = switchIds[0];
  const switch2 = switchIds[1];

  const isLongDistance = randomNumber(0, 100) > 80;
  const delay = isLongDistance ? 200 : 10;
  const bandwidth = isLongDistance ? 125 : 12.5;

  return {
    attributes: {
      id: index,
      delay,
      bandwidth,
      bandwidth_demand: 0,
      active: true,
    },
    relationships: {
      topology: {
        class: "Topology",
        id: 1,
      },
      active_flows: [],
      applications: [],
      nodes: [
        {
          class: "NetworkSwitch",
          id: switch1,
        },
        {
          class: "NetworkSwitch",
          id: switch2,
        },
      ],
    },
  };
};

export const generateRandomBaseStation = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const gridSize = 100;
  const x = (index % gridSize) * 2;
  const y = Math.floor(index / gridSize) * 2;

  const networkSwitchId = context?.getRandomId("NetworkSwitch");
  if (networkSwitchId === null) {
    console.warn(
      `Cannot generate BaseStation ${index}: no NetworkSwitches available`
    );
    return null as any;
  }

  return {
    attributes: {
      id: index,
      coordinates: [x, y],
      wireless_delay: 10,
    },
    relationships: {
      users: [],
      edge_servers: [],
      network_switch: {
        class: "NetworkSwitch",
        id: networkSwitchId,
      },
    },
  };
};

export const generateRandomUser = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const coordinatesList = generateGridCoordinates(100, 100);
  const coordinates = coordinatesList[index % coordinatesList.length];

  const traceLength = 60;
  const coordinates_trace = Array(traceLength).fill(coordinates);

  const baseStationId = context?.getRandomId("BaseStation") ?? 0;

  // Get 1-3 random applications for this user
  const numApps = randomNumber(1, 3);
  const applicationIds = context?.getRandomIds("Application", numApps) ?? [
    index,
  ];
  const accessPatternIds =
    context?.getRandomIds(
      "CircularDurationAndIntervalAccessPattern",
      applicationIds.length
    ) ?? applicationIds;

  // Build objects for each application
  const delays: Record<number, null> = {};
  const delay_slas: Record<number, number> = {};
  const making_requests: Record<number, Record<number, boolean>> = {};
  const access_patterns: Record<number, { class: string; id: number }> = {};
  const applications: Array<{ class: string; id: number }> = [];

  applicationIds.forEach((appId, idx) => {
    delays[appId] = null;
    delay_slas[appId] = randomNumber(30, 40);
    making_requests[appId] = { 1: true };
    access_patterns[appId] = {
      class: "CircularDurationAndIntervalAccessPattern",
      id: accessPatternIds[idx] ?? appId,
    };
    applications.push({
      class: "Application",
      id: appId,
    });
  });

  return {
    attributes: {
      id: index,
      coordinates,
      coordinates_trace,
      delays,
      delay_slas,
      communication_paths: {},
      making_requests,
      providers_trust: {
        1: 2,
        2: 2,
        3: 2,
      },
    },
    relationships: {
      access_patterns,
      mobility_model: "pathway",
      applications,
      base_station: {
        class: "BaseStation",
        id: baseStationId,
      },
    },
  };
};

export const generateRandomEdgeServer = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const models = [
    {
      name: "E5430",
      cpu: 8,
      memory: 16384,
      disk: 131072,
      max_power: 265,
      static_power: 0.6264,
      provider: 1,
    },
    {
      name: "E5507",
      cpu: 8,
      memory: 8192,
      disk: 131072,
      max_power: 218,
      static_power: 0.3073,
      provider: 2,
    },
    {
      name: "E5645",
      cpu: 12,
      memory: 16384,
      disk: 131072,
      max_power: 200,
      static_power: 0.3155,
      provider: 3,
    },
  ];

  const model = randomElement(models);
  const gridSize = 100;
  const x = (index % gridSize) * 2;
  const y = Math.floor(index / gridSize) * 2;

  const baseStationId = context?.getRandomId("BaseStation");
  const networkSwitchId = context?.getRandomId("NetworkSwitch");
  if (baseStationId === null || networkSwitchId === null) {
    console.warn(
      `Cannot generate EdgeServer ${index}: need BaseStation and NetworkSwitch`
    );
    return null as any;
  }

  return {
    attributes: {
      id: index,
      available: true,
      model_name: model.name,
      cpu: model.cpu,
      memory: model.memory,
      disk: model.disk,
      cpu_demand: 0,
      memory_demand: 0,
      disk_demand: 0,
      coordinates: [x, y],
      max_concurrent_layer_downloads: 3,
      active: true,
      power_model_parameters: {
        max_power_consumption: model.max_power,
        static_power_percentage: model.static_power,
      },
      infrastructure_provider: model.provider,
    },
    relationships: {
      power_model: "LinearServerPowerModel",
      base_station: {
        class: "BaseStation",
        id: baseStationId,
      },
      network_switch: {
        class: "NetworkSwitch",
        id: networkSwitchId,
      },
      services: [],
      container_layers: [],
      container_images: [],
      container_registries: [],
    },
  };
};

export const generateRandomService = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const cpuOptions = [2, 4, 8, 16];
  const memoryOptions = [2048, 4096, 8192, 16384];

  const applicationId = context?.getRandomId("Application") ?? (index % 6) + 1;

  // Get a random ContainerImage from the context
  const containerImages = context?.existingItems["ContainerImage"] ?? [];
  const containerImage =
    containerImages.length > 0 ? randomElement(containerImages) : null;

  const imageDigest =
    containerImage?.attributes?.digest ?? `sha256:${randomString(64)}`;
  const imageLabel = containerImage?.attributes?.name ?? "unknown";

  return {
    attributes: {
      id: index,
      label: imageLabel,
      state: 0,
      _available: true,
      cpu_demand: randomElement(cpuOptions),
      memory_demand: randomElement(memoryOptions),
      image_digest: imageDigest,
      privacy_requirement: 0,
      drop: false,
    },
    relationships: {
      application: {
        class: "Application",
        id: applicationId,
      },
      server: null,
    },
  };
};

export const generateRandomApplication = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const serviceId = context?.getRandomId("Service") ?? index;
  const userId = context?.getRandomId("User") ?? index;

  return {
    attributes: {
      id: index,
      label: "",
    },
    relationships: {
      services: [
        {
          class: "Service",
          id: serviceId,
        },
      ],
      users: [
        {
          class: "User",
          id: userId,
        },
      ],
    },
  };
};

export const generateRandomAccessPattern = (
  index: number,
  context?: GenerationContext
): Record<string, any> => {
  const userId = context?.getRandomId("User") ?? index;
  const applicationId = context?.getRandomId("Application") ?? index;

  return {
    attributes: {
      id: index,
      duration_values: [9007199254740991],
      interval_values: [0],
      history: [
        {
          start: 1,
          end: 9007199254740991,
          duration: 9007199254740991,
          waiting_time: 0,
          access_time: 0,
          interval: 0,
          next_access: 9007199254740991,
        },
      ],
    },
    relationships: {
      user: {
        class: "User",
        id: userId,
      },
      app: {
        class: "Application",
        id: applicationId,
      },
    },
  };
};

/**
 * Create a generation context from existing data
 */
export const createGenerationContext = (
  existingItems: Record<string, any[]>
): GenerationContext => {
  const getIds = (itemType: string): number[] => {
    const items = existingItems[itemType] || [];
    return items
      .map((item) => item.attributes?.id ?? item.id ?? 0)
      .filter((id) => id !== null);
  };

  return {
    existingItems,
    getRandomId: (itemType: string): number | null => {
      const ids = getIds(itemType);
      return ids.length > 0 ? randomElement(ids) : null;
    },
    getRandomIds: (itemType: string, count: number = 2): number[] => {
      const ids = getIds(itemType);
      if (ids.length === 0) return [];
      if (ids.length <= count) return ids;

      const selected: number[] = [];
      const available = [...ids];
      for (let i = 0; i < count && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        selected.push(available[idx]);
        available.splice(idx, 1);
      }
      return selected;
    },
  };
};

/**
 * Factory function to get the appropriate generator based on item type
 */
export const getGeneratorForType = (
  type: string
): ((index: number, context?: GenerationContext) => Record<string, any>) => {
  const generators: Record<
    string,
    (index: number, context?: GenerationContext) => Record<string, any>
  > = {
    NetworkSwitch: generateRandomNetworkSwitch,
    NetworkLink: generateRandomNetworkLink,
    BaseStation: generateRandomBaseStation,
    User: generateRandomUser,
    EdgeServer: generateRandomEdgeServer,
    Service: generateRandomService,
    Application: generateRandomApplication,
    CircularDurationAndIntervalAccessPattern: generateRandomAccessPattern,
  };

  return (
    generators[type] ||
    ((index, context) => ({
      attributes: {
        id: index,
        label: `item_${index}`,
        type,
      },
      relationships: {},
    }))
  );
};

/**
 * Create a custom generator function with placeholder support
 */
export const createCustomGenerator = (
  template: Record<string, any>
): ((index: number) => Record<string, any>) => {
  return (index: number) => {
    const deepClone = JSON.parse(JSON.stringify(template));

    const replaceValues = (obj: any): any => {
      if (typeof obj === "string") {
        return obj
          .replace(/\{ID\}/g, String(index))
          .replace(/\{NAME\}/g, `item_${index}`)
          .replace(/\{RANDOM\}/g, randomString(8))
          .replace(/\{TIMESTAMP\}/g, new Date().toISOString());
      } else if (typeof obj === "number" && obj === -1) {
        return randomNumber(0, 1000);
      } else if (Array.isArray(obj)) {
        return obj.map(replaceValues);
      } else if (obj !== null && typeof obj === "object") {
        return Object.keys(obj).reduce((acc, key) => {
          acc[key] = replaceValues(obj[key]);
          return acc;
        }, {} as any);
      }
      return obj;
    };

    return replaceValues(deepClone);
  };
};

/**
 * Update bidirectional relationships
 * When a new item is created with relationships, also add the reciprocal relationship to the related items
 */
export const updateBidirectionalRelationships = (
  newItems: Record<string, any[]>,
  allExistingItems: Record<string, any[]>
): Record<string, any[]> => {
  const updated = JSON.parse(JSON.stringify(allExistingItems));

  // Define bidirectional relationships: [sourceType, sourceField] -> [targetType, targetField]
  const bidirectionalMappings: Record<
    string,
    Record<string, { type: string; field: string }>
  > = {
    User: {
      applications: { type: "Application", field: "users" },
      base_station: { type: "BaseStation", field: "users" },
      access_patterns: {
        type: "CircularDurationAndIntervalAccessPattern",
        field: "user",
      },
    },
    Application: {
      services: { type: "Service", field: "application" },
      users: { type: "User", field: "applications" },
    },
    Service: {
      application: { type: "Application", field: "services" },
      server: { type: "EdgeServer", field: "services" },
    },
    EdgeServer: {
      services: { type: "Service", field: "server" },
      base_station: { type: "BaseStation", field: "edge_servers" },
      network_switch: { type: "NetworkSwitch", field: "edge_servers" },
    },
    BaseStation: {
      users: { type: "User", field: "base_station" },
      edge_servers: { type: "EdgeServer", field: "base_station" },
      network_switch: { type: "NetworkSwitch", field: "base_station" },
    },
    NetworkSwitch: {
      edge_servers: { type: "EdgeServer", field: "network_switch" },
      base_station: { type: "BaseStation", field: "network_switch" },
      links: { type: "NetworkLink", field: "nodes" },
    },
    CircularDurationAndIntervalAccessPattern: {
      user: { type: "User", field: "access_patterns" },
      app: { type: "Application", field: "access_patterns" },
    },
  };

  // For each new item type
  Object.entries(newItems).forEach(([sourceType, items]) => {
    items.forEach((newItem) => {
      const sourceId = newItem.attributes?.id ?? newItem.id;
      const mappings = bidirectionalMappings[sourceType];

      if (!mappings) return;

      // For each relationship in the new item
      Object.entries(mappings).forEach(([sourceField, targetInfo]) => {
        const relationshipValue = newItem.relationships?.[sourceField];
        if (!relationshipValue) return;

        // Handle different relationship formats
        let targetIds: Array<{ id: number; class: string }> = [];

        if (Array.isArray(relationshipValue)) {
          // Array of relationships (e.g., services, users, edge_servers)
          targetIds = relationshipValue
            .map((rel) => ({
              id: rel.id ?? rel,
              class: rel.class ?? targetInfo.type,
            }))
            .filter((rel) => rel.id !== undefined && rel.id !== null);
        } else if (relationshipValue && typeof relationshipValue === "object") {
          // Single relationship object (e.g., base_station, server, application)
          targetIds = [
            {
              id: relationshipValue.id,
              class: relationshipValue.class ?? targetInfo.type,
            },
          ];
        }

        // Add reciprocal relationship to target items
        targetIds.forEach(({ id, class: targetClass }) => {
          const targetType = targetInfo.type;
          const targetField = targetInfo.field;

          if (!updated[targetType]) {
            updated[targetType] = [];
          }

          const targetItem = updated[targetType].find(
            (item) => (item.attributes?.id ?? item.id) === id
          );

          if (targetItem) {
            if (!targetItem.relationships) {
              targetItem.relationships = {};
            }

            // Define which fields are array fields vs single value fields
            const arrayFields = [
              "applications",
              "users",
              "services",
              "edge_servers",
              "links",
              "access_patterns",
              "users",
            ];

            const isTargetFieldArray = arrayFields.includes(targetField);

            if (isTargetFieldArray) {
              // Target field should be an array
              if (!Array.isArray(targetItem.relationships[targetField])) {
                targetItem.relationships[targetField] = [];
              }

              const refAlreadyExists = targetItem.relationships[
                targetField
              ].some((ref: any) => (ref.id ?? ref) === sourceId);

              if (!refAlreadyExists) {
                targetItem.relationships[targetField].push({
                  class: sourceType,
                  id: sourceId,
                });
              }
            } else {
              // Target field should be a single relationship object
              targetItem.relationships[targetField] = {
                class: sourceType,
                id: sourceId,
              };
            }
          }
        });
      });
    });
  });

  return updated;
};
