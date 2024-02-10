--#region Functions

---Returns the string with only the first character as uppercase and lowercases the rest of the string
---@param s string
---@return string
function string.firstToUpper(s)
    if not s or s == "" then return "" end
    return s:sub(1, 1):upper() .. s:sub(2):lower()
end

---@param action string The action you wish to target
---@param data any The data you wish to send along with this action
function UIMessage(action, data)
    SendNUIMessage({
        action = action,
        data = data
    })
end

---@param shouldShow boolean
---@param inImpound? boolean
function ToggleNuiFrame(shouldShow, inImpound)
    SetNuiFocus(shouldShow, shouldShow)
    UIMessage("setVisible", { visible = shouldShow, inImpound = inImpound and inImpound or false })
end

--#endregion Functions

--#region State Bag Change Handlers

AddStateBagChangeHandler("cacheVehicle", "vehicle", function(bagName, key, value)
    if not value then return end

    local networkId = tonumber(bagName:gsub("entity:", ""), 10)
    local validEntity, timeout = false, 0

    while not validEntity and timeout < 1000 do
        validEntity = NetworkDoesEntityExistWithNetworkId(networkId)
        timeout += 1
        Wait(0)
    end

    if not validEntity then
        return lib.print.warn(("^7Statebag (^3%s^7) timed out after waiting %s ticks for entity creation on %s.^0"):format(bagName, timeout, key))
    end

    Wait(500)

    local vehicle = NetworkDoesEntityExistWithNetworkId(networkId) and NetworkGetEntityFromNetworkId(networkId)
    if not vehicle or vehicle == 0 or NetworkGetEntityOwner(vehicle) ~= cache.playerId then return end

    SetVehicleOnGroundProperly(vehicle)
    SetVehicleNeedsToBeHotwired(vehicle, false)

    Entity(vehicle).state:set(key, nil, true)
end)

AddStateBagChangeHandler("vehicleProps", "vehicle", function(bagName, key, value)
    if not value then return end

    local networkId = tonumber(bagName:gsub("entity:", ""), 10)
    local validEntity, timeout = false, 0

    while not validEntity and timeout < 1000 do
        validEntity = NetworkDoesEntityExistWithNetworkId(networkId)
        timeout += 1
        Wait(0)
    end

    if not validEntity then
        return lib.print.warn(("^^7Statebag (^3%s^7) timed out after waiting %s ticks for entity creation on %s.^0"):format(bagName, timeout, key))
    end

    Wait(500)

    local vehicle = NetworkDoesEntityExistWithNetworkId(networkId) and NetworkGetEntityFromNetworkId(networkId)
    if not vehicle or vehicle == 0 or NetworkGetEntityOwner(vehicle) ~= cache.playerId or not lib.setVehicleProperties(vehicle, value) then return end

    Entity(vehicle).state:set(key, nil, true)
end)

--#endregion State Bag Change Handlers
