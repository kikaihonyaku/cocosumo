import { describe, it, expect, beforeEach } from 'vitest';
import {
  flattenRooms,
  filterRooms,
  buildFilteredProperties,
  calculateAggregations,
} from './propertyFilterUtils';

describe('propertyFilterUtils', () => {
  describe('flattenRooms', () => {
    it('extracts rooms from properties with building reference', () => {
      const properties = [
        {
          id: 1,
          name: 'Building A',
          rooms: [
            { id: 101, room_type: '1K', rent: 80000 },
            { id: 102, room_type: '1LDK', rent: 120000 },
          ],
        },
        {
          id: 2,
          name: 'Building B',
          rooms: [{ id: 201, room_type: '2LDK', rent: 150000 }],
        },
      ];

      const rooms = flattenRooms(properties);

      expect(rooms).toHaveLength(3);
      expect(rooms[0].id).toBe(101);
      expect(rooms[0].building_id).toBe(1);
      expect(rooms[0].building.name).toBe('Building A');
      expect(rooms[2].building_id).toBe(2);
    });

    it('returns empty array for null input', () => {
      expect(flattenRooms(null)).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      expect(flattenRooms(undefined)).toEqual([]);
    });

    it('handles properties without rooms', () => {
      const properties = [
        { id: 1, name: 'Empty Building' },
        { id: 2, name: 'Building', rooms: [] },
      ];

      const rooms = flattenRooms(properties);
      expect(rooms).toEqual([]);
    });
  });

  describe('filterRooms', () => {
    const testRooms = [
      { id: 1, rent: 50000, room_type: '1K', area: 20, building: { built_date: '2020-01-01' } },
      { id: 2, rent: 80000, room_type: '1LDK', area: 35, building: { built_date: '2015-01-01' } },
      { id: 3, rent: 150000, room_type: '2LDK', area: 60, building: { built_date: '2000-01-01' } },
      { id: 4, rent: 250000, room_type: '3LDK', area: 85, building: { built_date: '1990-01-01' } },
    ];

    describe('rent filter', () => {
      it('filters by minimum rent', () => {
        const filtered = filterRooms(testRooms, { rentRange: [100000, 300000] });
        expect(filtered.map((r) => r.id)).toEqual([3, 4]);
      });

      it('filters by maximum rent', () => {
        const filtered = filterRooms(testRooms, { rentRange: [0, 100000] });
        expect(filtered.map((r) => r.id)).toEqual([1, 2]);
      });

      it('treats 300000 as unlimited maximum', () => {
        const filtered = filterRooms(testRooms, { rentRange: [200000, 300000] });
        expect(filtered.map((r) => r.id)).toEqual([4]);
      });
    });

    describe('room type filter', () => {
      it('filters by single room type', () => {
        const filtered = filterRooms(testRooms, { roomTypes: ['1K'] });
        expect(filtered.map((r) => r.id)).toEqual([1]);
      });

      it('filters by multiple room types', () => {
        const filtered = filterRooms(testRooms, { roomTypes: ['1K', '1LDK'] });
        expect(filtered.map((r) => r.id)).toEqual([1, 2]);
      });

      it('returns all rooms when roomTypes is empty', () => {
        const filtered = filterRooms(testRooms, { roomTypes: [] });
        expect(filtered).toHaveLength(4);
      });
    });

    describe('area filter', () => {
      it('filters by minimum area', () => {
        const filtered = filterRooms(testRooms, { areaRange: [50, 200] });
        expect(filtered.map((r) => r.id)).toEqual([3, 4]);
      });

      it('filters by maximum area', () => {
        const filtered = filterRooms(testRooms, { areaRange: [0, 40] });
        expect(filtered.map((r) => r.id)).toEqual([1, 2]);
      });
    });

    describe('range selection filter', () => {
      it('filters by selected rent ranges', () => {
        const filtered = filterRooms(testRooms, {}, { selectedRentRanges: ['50000-100000'] });
        expect(filtered.map((r) => r.id)).toEqual([1, 2]);
      });

      it('handles plus notation for unlimited ranges', () => {
        const filtered = filterRooms(testRooms, {}, { selectedRentRanges: ['200000+'] });
        expect(filtered.map((r) => r.id)).toEqual([4]);
      });

      it('filters by multiple selected ranges', () => {
        // 0-50000 includes rent < 50000 (room 1 with 50000 is NOT included since 50000 >= 50000)
        // 100000-150000 includes 100000 <= rent < 150000 (room 3 with 150000 is NOT included since 150000 >= 150000)
        // Only room 2 (80000) would be in neither range
        const filtered = filterRooms(testRooms, {}, { selectedRentRanges: ['0-100000', '150000-200000'] });
        expect(filtered.map((r) => r.id)).toEqual([1, 2, 3]); // 50000, 80000 in 0-100000; 150000 in 150000-200000
      });
    });

    it('returns empty array for null input', () => {
      expect(filterRooms(null, {})).toEqual([]);
    });

    it('handles missing filter object', () => {
      const filtered = filterRooms(testRooms, null);
      expect(filtered).toHaveLength(4);
    });
  });

  describe('buildFilteredProperties', () => {
    const properties = [
      {
        id: 1,
        name: 'Building A',
        rooms: [
          { id: 101, status: 'vacant' },
          { id: 102, status: 'occupied' },
        ],
      },
      {
        id: 2,
        name: 'Building B',
        rooms: [{ id: 201, status: 'vacant' }],
      },
    ];

    it('rebuilds property list from filtered rooms', () => {
      const filteredRooms = [
        { id: 101, building_id: 1 },
        { id: 201, building_id: 2 },
      ];

      const result = buildFilteredProperties(properties, filteredRooms);

      expect(result).toHaveLength(2);
      expect(result[0].rooms).toHaveLength(1);
      expect(result[0].room_cnt).toBe(1);
      expect(result[0].free_cnt).toBe(1);
    });

    it('excludes properties with no matching rooms', () => {
      const filteredRooms = [{ id: 201, building_id: 2 }];

      const result = buildFilteredProperties(properties, filteredRooms);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('includes properties without rooms', () => {
      const propertiesWithEmpty = [
        ...properties,
        { id: 3, name: 'Empty Building' },
      ];
      const filteredRooms = [{ id: 101, building_id: 1 }];

      const result = buildFilteredProperties(propertiesWithEmpty, filteredRooms);

      expect(result.find((p) => p.id === 3)).toBeDefined();
    });

    it('returns empty array for null properties', () => {
      expect(buildFilteredProperties(null, [])).toEqual([]);
    });
  });

  describe('calculateAggregations', () => {
    const rooms = [
      { rent: 40000, room_type: '1K', area: 18, building: { built_date: '2022-01-01' } },
      { rent: 80000, room_type: '1LDK', area: 35, building: { built_date: '2018-01-01' } },
      { rent: 120000, room_type: '2LDK', area: 55, building: { built_date: '2010-01-01' } },
      { rent: 180000, room_type: '3LDK', area: 75, building: { built_date: '2000-01-01' } },
      { rent: 250000, room_type: '3LDK', area: 90, building: { built_date: '1990-01-01' } },
    ];

    it('returns total count', () => {
      const agg = calculateAggregations(rooms);
      expect(agg.total).toBe(5);
    });

    it('aggregates by rent ranges', () => {
      const agg = calculateAggregations(rooms);

      expect(agg.by_rent[0].range).toBe('0-50000');
      expect(agg.by_rent[0].count).toBe(1); // 40000
      expect(agg.by_rent[1].count).toBe(1); // 80000
      expect(agg.by_rent[2].count).toBe(1); // 120000
      expect(agg.by_rent[3].count).toBe(1); // 180000
      expect(agg.by_rent[4].count).toBe(1); // 250000
    });

    it('aggregates by room type', () => {
      const agg = calculateAggregations(rooms);

      expect(agg.by_room_type['1K']).toBe(1);
      expect(agg.by_room_type['1LDK']).toBe(1);
      expect(agg.by_room_type['2LDK']).toBe(1);
      expect(agg.by_room_type['3LDK']).toBe(2);
    });

    it('aggregates by area ranges', () => {
      const agg = calculateAggregations(rooms);

      expect(agg.by_area[0].count).toBe(1); // 18
      expect(agg.by_area[1].count).toBe(1); // 35
      expect(agg.by_area[2].count).toBe(1); // 55
      expect(agg.by_area[3].count).toBe(1); // 75
      expect(agg.by_area[4].count).toBe(1); // 90
    });

    it('aggregates by building age', () => {
      const agg = calculateAggregations(rooms);
      const currentYear = new Date().getFullYear();

      // Check counts based on age
      // 2022 -> ~3 years (0-5)
      // 2018 -> ~7 years (5-10)
      // 2010 -> ~15 years (10-20)
      // 2000 -> ~25 years (20-30)
      // 1990 -> ~35 years (30+)
      expect(agg.by_building_age[0].count).toBe(1);
      expect(agg.by_building_age[1].count).toBe(1);
      expect(agg.by_building_age[2].count).toBe(1);
      expect(agg.by_building_age[3].count).toBe(1);
      expect(agg.by_building_age[4].count).toBe(1);
    });

    it('returns empty aggregations for null input', () => {
      const agg = calculateAggregations(null);

      expect(agg.total).toBe(0);
      expect(agg.by_rent.every((r) => r.count === 0)).toBe(true);
    });

    it('handles rooms with unknown room type', () => {
      const roomsWithUnknown = [{ rent: 50000, room_type: 'unknown_type', area: 30 }];

      const agg = calculateAggregations(roomsWithUnknown);
      expect(agg.by_room_type['other']).toBe(1);
    });

    it('handles rooms without built_date', () => {
      const roomsNoBuildDate = [{ rent: 50000, room_type: '1K', area: 30 }];

      const agg = calculateAggregations(roomsNoBuildDate);
      // Should not throw and age categories should all be 0
      expect(agg.by_building_age.every((r) => r.count === 0)).toBe(true);
    });
  });
});
