import { ApiError, type RoomInfo } from "@/api/client";
import { decide, type Choice } from "../oneTableFlow";

const TABLE = { id: "r1", code: "HUSTLE", status: "waiting" } as RoomInfo;
const busy = new ApiError("already_in_room", "You are already at another table", 409);

function setup(tables: (RoomInfo | null)[], choice: Choice, fails = 0) {
  const asked: RoomInfo[] = [];
  let calls = 0;
  const action = jest.fn(async () => {
    calls += 1;
    if (calls <= fails) throw busy;
  });
  const other = jest.fn(async () => tables.shift() ?? null);
  const ask = jest.fn(async (room: RoomInfo) => {
    asked.push(room);
    return choice;
  });
  return { action, deps: { other, ask }, asked };
}

describe("one table at a time", () => {
  it("just runs when I'm at no other table", async () => {
    const { action, deps, asked } = setup([null], "leave");
    await expect(decide(action, deps)).resolves.toBe("done");
    expect(action).toHaveBeenCalledTimes(1);
    expect(asked).toEqual([]);
  });

  it("asks first, and carries on after a Leave", async () => {
    const { action, deps, asked } = setup([TABLE], "leave");
    await expect(decide(action, deps)).resolves.toBe("done");
    expect(asked).toEqual([TABLE]);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("goes back without doing anything", async () => {
    const { action, deps } = setup([TABLE], "back");
    await expect(decide(action, deps)).resolves.toBe("back");
    expect(action).not.toHaveBeenCalled();
  });

  it("does nothing when the sheet is closed", async () => {
    const { action, deps } = setup([TABLE], "cancel");
    await expect(decide(action, deps)).resolves.toBe("cancelled");
    expect(action).not.toHaveBeenCalled();
  });

  it("asks when the server says I'm at a table, then tries again", async () => {
    const { action, deps, asked } = setup([null, TABLE], "leave", 1);
    await expect(decide(action, deps)).resolves.toBe("done");
    expect(asked).toEqual([TABLE]);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("passes other errors on", async () => {
    const full = new ApiError("room_full", "Room is full", 409);
    const action = jest.fn(async () => {
      throw full;
    });
    const deps = { other: async () => null, ask: jest.fn() };
    await expect(decide(action, deps)).rejects.toBe(full);
    expect(deps.ask).not.toHaveBeenCalled();
  });
});
