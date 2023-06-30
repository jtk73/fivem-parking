-- Shared classes for lua language server annotation

---@class Vehicle
---@field owner string | number
---@field model string | number This is supposed to be only a number, but this: `adder` is seen as a string
---@field props table
---@field location 'outside' | 'parked' | 'impound'
---@field type? 'car' | 'van' | 'truck' | 'bicycle' | 'motorcycle' | 'boat' | 'helicopter' | 'plane' | 'train' | 'emergency'
---@field temporary? boolean

---@class VehicleDatabase
---@field owner string
---@field plate string
---@field model integer
---@field props string
---@field location 'outside' | 'parked' | 'impound'
---@field type 'car' | 'van' | 'truck' | 'bicycle' | 'motorcycle' | 'boat' | 'helicopter' | 'plane' | 'train' | 'emergency'