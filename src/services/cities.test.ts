import { it, expect } from "vitest";
import { parseCities } from "./cities";
it("只接受国内地区的合法坐标，并保留行政区区分同名地点", () => {
  expect(
    parseCities({
      results: [
        {
          id: 1,
          name: "苏州",
          country_code: "CN",
          latitude: 31,
          longitude: 120,
          admin1: "江苏省",
          admin2: "苏州",
        },
        {
          id: 2,
          name: "外地",
          country_code: "US",
          latitude: 31,
          longitude: 120,
        },
        {
          id: 3,
          name: "坏数据",
          country_code: "CN",
          latitude: NaN,
          longitude: 120,
        },
      ],
    }),
  ).toEqual([
    {
      id: "geo-1",
      name: "苏州",
      latitude: 31,
      longitude: 120,
      region: "江苏省",
    },
  ]);
});
