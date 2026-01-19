import {
  createGenerationContext,
  generateRandomAccessPattern,
  updateBidirectionalRelationships,
} from "@/lib/generators";
import { ScenarioData } from "./types";

export const handleGenerateItems = (
  type: string,
  newItems: any[],
  setData: React.Dispatch<React.SetStateAction<ScenarioData>>,
  addDependencies: boolean = true,
) => {
  setData((previous) => {
    const newData = { ...previous };
    const existingItems = newData[type] || [];
    const maxId = Math.max(
      0,
      ...existingItems.map((item) => item.attributes?.id || item.id || 0),
    );

    const itemsWithIds = newItems
      .filter((item) => item !== null && item !== undefined)
      .map((item, idx) => {
        const updated = JSON.parse(JSON.stringify(item));
        if (
          updated.attributes?.id === undefined &&
          item.attributes?.id === undefined
        ) {
          if (updated.attributes) updated.attributes.id = maxId + idx + 1;
          else if (updated.id === undefined) updated.id = maxId + idx + 1;
        }
        return updated;
      });

    newData[type] = [...existingItems, ...itemsWithIds];

    if (!addDependencies) return newData;

    let updatedDataWithRelationships = updateBidirectionalRelationships(
      { [type]: itemsWithIds },
      newData,
    );

    if (type === "User") {
      updatedDataWithRelationships = generateUserAccessPatterns(
        itemsWithIds,
        updatedDataWithRelationships,
      );
    }

    if (type === "Application") {
      updatedDataWithRelationships = generateApplicationAccessPatterns(
        itemsWithIds,
        updatedDataWithRelationships,
      );
    }

    if (type === "NetworkSwitch") {
      updatedDataWithRelationships = generateNetworkLinks(
        itemsWithIds,
        updatedDataWithRelationships,
      );
    }

    return updatedDataWithRelationships;
  });
};

const generateUserAccessPatterns = (
  itemsWithIds: any[],
  updatedDataWithRelationships: ScenarioData,
) => {
  const accessPatterns =
    updatedDataWithRelationships["CircularDurationAndIntervalAccessPattern"] ||
    [];
  const existingAccessPatternMaxId = Math.max(
    0,
    ...accessPatterns.map((ap) => ap.attributes?.id || ap.id || 0),
  );

  let nextAccessPatternId = existingAccessPatternMaxId + 1;
  const newAccessPatterns: any[] = [];

  itemsWithIds.forEach((user) => {
    const userId = user.attributes?.id || user.id;
    const userApplications = user.relationships?.applications || [];

    userApplications.forEach((appRef: any) => {
      const appId = appRef.id ?? appRef;
      const accessPattern = generateRandomAccessPattern(
        nextAccessPatternId,
        createGenerationContext(updatedDataWithRelationships),
      );

      accessPattern.attributes.id = nextAccessPatternId;
      accessPattern.relationships.user = { class: "User", id: userId };
      accessPattern.relationships.app = {
        class: "Application",
        id: appId,
      };

      newAccessPatterns.push(accessPattern);
      nextAccessPatternId++;
    });

    if (!user.relationships) user.relationships = {};
    user.relationships.access_patterns = userApplications
      .map((appRef: any) => {
        const appId = appRef.id ?? appRef;
        const matchingPattern = newAccessPatterns.find(
          (ap) =>
            ap.relationships.user.id === userId &&
            ap.relationships.app.id === appId,
        );
        return matchingPattern
          ? {
              class: "CircularDurationAndIntervalAccessPattern",
              id: matchingPattern.attributes.id,
            }
          : null;
      })
      .filter((ap: any) => ap !== null);
  });

  if (newAccessPatterns.length > 0) {
    updatedDataWithRelationships["CircularDurationAndIntervalAccessPattern"] = [
      ...accessPatterns,
      ...newAccessPatterns,
    ];

    newAccessPatterns.forEach((accessPattern) => {
      const appId = accessPattern.relationships.app.id;
      const app = updatedDataWithRelationships.Application?.find(
        (application) =>
          (application.attributes?.id || application.id) === appId,
      );

      if (app) {
        if (!app.relationships) app.relationships = {};
        if (!Array.isArray(app.relationships.access_patterns))
          app.relationships.access_patterns = [];

        const exists = app.relationships.access_patterns.some(
          (ref: any) => (ref.id ?? ref) === accessPattern.attributes.id,
        );

        if (!exists) {
          app.relationships.access_patterns.push({
            class: "CircularDurationAndIntervalAccessPattern",
            id: accessPattern.attributes.id,
          });
        }
      }
    });

    updatedDataWithRelationships = updateBidirectionalRelationships(
      { CircularDurationAndIntervalAccessPattern: newAccessPatterns },
      updatedDataWithRelationships,
    );
  }

  return updatedDataWithRelationships;
};

const generateApplicationAccessPatterns = (
  itemsWithIds: any[],
  updatedDataWithRelationships: ScenarioData,
) => {
  const accessPatterns =
    updatedDataWithRelationships["CircularDurationAndIntervalAccessPattern"] ||
    [];
  const existingAccessPatternMaxId = Math.max(
    0,
    ...accessPatterns.map((ap) => ap.attributes?.id || ap.id || 0),
  );

  let nextAccessPatternId = existingAccessPatternMaxId + 1;
  const newAccessPatterns: any[] = [];

  itemsWithIds.forEach((app) => {
    const appId = app.attributes?.id || app.id;
    const appUsers = app.relationships?.users || [];

    appUsers.forEach((userRef: any) => {
      const userId = userRef.id ?? userRef;
      const accessPattern = generateRandomAccessPattern(
        nextAccessPatternId,
        createGenerationContext(updatedDataWithRelationships),
      );

      accessPattern.attributes.id = nextAccessPatternId;
      accessPattern.relationships.user = { class: "User", id: userId };
      accessPattern.relationships.app = {
        class: "Application",
        id: appId,
      };

      newAccessPatterns.push(accessPattern);
      nextAccessPatternId++;
    });

    if (!app.relationships) app.relationships = {};
    app.relationships.access_patterns = appUsers
      .map((userRef: any) => {
        const userId = userRef.id ?? userRef;
        const matchingPattern = newAccessPatterns.find(
          (ap) =>
            ap.relationships.user.id === userId &&
            ap.relationships.app.id === appId,
        );
        return matchingPattern
          ? {
              class: "CircularDurationAndIntervalAccessPattern",
              id: matchingPattern.attributes.id,
            }
          : null;
      })
      .filter((ap: any) => ap !== null);
  });

  if (newAccessPatterns.length > 0) {
    updatedDataWithRelationships["CircularDurationAndIntervalAccessPattern"] = [
      ...accessPatterns,
      ...newAccessPatterns,
    ];

    newAccessPatterns.forEach((accessPattern) => {
      const userId = accessPattern.relationships.user.id;
      const user = updatedDataWithRelationships.User?.find(
        (u) => (u.attributes?.id || u.id) === userId,
      );

      if (user) {
        if (!user.relationships) user.relationships = {};
        if (!Array.isArray(user.relationships.access_patterns))
          user.relationships.access_patterns = [];

        const exists = user.relationships.access_patterns.some(
          (ref: any) => (ref.id ?? ref) === accessPattern.attributes.id,
        );

        if (!exists) {
          user.relationships.access_patterns.push({
            class: "CircularDurationAndIntervalAccessPattern",
            id: accessPattern.attributes.id,
          });
        }
      }
    });

    updatedDataWithRelationships = updateBidirectionalRelationships(
      { CircularDurationAndIntervalAccessPattern: newAccessPatterns },
      updatedDataWithRelationships,
    );
  }

  return updatedDataWithRelationships;
};

const generateNetworkLinks = (
  itemsWithIds: any[],
  updatedDataWithRelationships: ScenarioData,
) => {
  const networkLinks = updatedDataWithRelationships["NetworkLink"] || [];
  const existingNetworkSwitches =
    updatedDataWithRelationships["NetworkSwitch"] || [];
  const existingNetworkLinkMaxId = Math.max(
    0,
    ...networkLinks.map((nl) => nl.attributes?.id || nl.id || 0),
  );

  let nextNetworkLinkId = existingNetworkLinkMaxId + 1;
  const newNetworkLinks: any[] = [];

  itemsWithIds.forEach((newSwitch) => {
    const newSwitchId = newSwitch.attributes?.id || newSwitch.id;
    const existingSwitch = existingNetworkSwitches.find(
      (switchItem) =>
        (switchItem.attributes?.id || switchItem.id) !== newSwitchId &&
        (switchItem.attributes?.id !== undefined ||
          switchItem.id !== undefined),
    );

    if (existingSwitch) {
      const existingSwitchId =
        existingSwitch.attributes?.id || existingSwitch.id;
      const isLongDistance = Math.random() > 0.8;
      const delay = isLongDistance ? 200 : 10;
      const bandwidth = isLongDistance ? 125 : 12.5;

      const networkLink = {
        attributes: {
          id: nextNetworkLinkId,
          delay,
          bandwidth,
          bandwidth_demand: 0,
          active: true,
        },
        relationships: {
          topology: { class: "Topology", id: 1 },
          active_flows: [],
          applications: [],
          nodes: [
            { class: "NetworkSwitch", id: newSwitchId },
            { class: "NetworkSwitch", id: existingSwitchId },
          ],
        },
      };

      newNetworkLinks.push(networkLink);
      nextNetworkLinkId++;
    }
  });

  if (newNetworkLinks.length > 0) {
    updatedDataWithRelationships["NetworkLink"] = [
      ...networkLinks,
      ...newNetworkLinks,
    ];

    newNetworkLinks.forEach((link) => {
      const linkNodes = link.relationships.nodes || [];
      linkNodes.forEach((nodeRef: any) => {
        const switchId = nodeRef.id;
        const switchItem = updatedDataWithRelationships.NetworkSwitch?.find(
          (networkSwitch) =>
            (networkSwitch.attributes?.id || networkSwitch.id) === switchId,
        );

        if (switchItem) {
          if (!switchItem.relationships) switchItem.relationships = {};
          if (!Array.isArray(switchItem.relationships.links))
            switchItem.relationships.links = [];

          const exists = switchItem.relationships.links.some(
            (ref: any) => (ref.id ?? ref) === link.attributes.id,
          );

          if (!exists) {
            switchItem.relationships.links.push({
              class: "NetworkLink",
              id: link.attributes.id,
            });
          }
        }
      });
    });
  }

  return updatedDataWithRelationships;
};
