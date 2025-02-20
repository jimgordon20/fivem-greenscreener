/// <reference types="@citizenfx/client" />

const config = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), 'config.json')
)

Delay = ms => new Promise(res => setTimeout(res, ms))

let cam = null
let camInfo = null

function sendNuiMessage (message) {
  SendNuiMessage(JSON.stringify(message))
}

async function takeScreenshotForComponent (
  pedType,
  type,
  component,
  drawable,
  texture
) {
  const cameraInfo = config.cameraSettings[type][component]

  if (!camInfo || camInfo.zPos !== cameraInfo.zPos) {
    camInfo = cameraInfo

    if (cam) {
      DestroyAllCams(true)
      DestroyCam(cam, true)
      cam = null
    }

    FreezeEntityPosition(PlayerPedId(), false)
    SetEntityCoordsNoOffset(
      PlayerPedId(),
      config.greenScreenPosition.x,
      config.greenScreenPosition.y,
      config.greenScreenPosition.z,
      false,
      false,
      false
    )

    SetEntityRotation(
      PlayerPedId(),
      config.greenScreenRotation.x,
      config.greenScreenRotation.y,
      config.greenScreenRotation.z,
      2,
      false
    )

    FreezeEntityPosition(PlayerPedId(), true)

    const [playerX, playerY, playerZ] = GetEntityCoords(PlayerPedId())

    const [fwdX, fwdY, fwdZ] = GetEntityForwardVector(PlayerPedId())

    const fwdPos = {
      x: playerX + fwdX * 1.2,
      y: playerY + fwdY * 1.2,
      z: playerZ + fwdZ + camInfo.zPos
    }

    cam = CreateCamWithParams(
      'DEFAULT_SCRIPTED_CAMERA',
      fwdPos.x,
      fwdPos.y,
      fwdPos.z,
      0,
      0,
      0,
      camInfo.fov,
      true,
      0
    )

    PointCamAtCoord(cam, playerX, playerY, playerZ + camInfo.zPos)

    SetCamActive(cam, true)
    RenderScriptCams(true, false, 0, true, false, 0)
  }

  await Delay(50)

  FreezeEntityPosition(PlayerPedId(), false)

  SetEntityCoordsNoOffset(
    PlayerPedId(),
    config.greenScreenPosition.x,
    config.greenScreenPosition.y,
    config.greenScreenPosition.z,
    false,
    false,
    false
  )

  SetEntityRotation(
    PlayerPedId(),
    camInfo.rotation.x,
    camInfo.rotation.y,
    camInfo.rotation.z,
    2,
    false
  )

  FreezeEntityPosition(PlayerPedId(), true)

  if (texture !== undefined) {
    if (type === 'PROPS') {
      emitNet(
        'takeScreenshot',
        pedType + '_prop_' + component + '_' + drawable + '_' + texture
      )
      await Delay(2000)
      return
    }
    emitNet(
      'takeScreenshot',
      pedType + '_' + component + '_' + drawable + '_' + texture
    )
    await Delay(2000)
    return
  }
  if (type === 'PROPS') {
    emitNet('takeScreenshot', pedType + '_prop_' + component + '_' + drawable)
    await Delay(2000)
    return
  }
  emitNet('takeScreenshot', pedType + '_' + component + '_' + drawable)
  await Delay(2000)
  return
}

function ClearAllPedProps () {
  for (const prop of Object.keys(config.cameraSettings.PROPS)) {
    ClearPedProp(PlayerPedId(), parseInt(prop))
  }
}

function ResetPed (gender) {
  NetworkOverrideClockTime(14, 0, 0)
  NetworkOverrideClockMillisecondsPerGameMinute(1000000)
  SetWeatherTypeNow('EXTRASUNNY')

  if (gender == 'male') {
    SetPedHeadBlendData(0, 0, 0, 31, 31, 31, 1, 1, 1)
    SetPedComponentVariation(PlayerPedId(), 0, 0, 1, 0) // Head
    SetPedComponentVariation(PlayerPedId(), 1, 0, 0, 0) // Mask
    SetPedComponentVariation(PlayerPedId(), 2, -1, 0, 0) // Hair
    SetPedComponentVariation(PlayerPedId(), 7, 0, 0, 0) // Accessories
    SetPedComponentVariation(PlayerPedId(), 5, 0, 0, 0) // Bags
    SetPedComponentVariation(PlayerPedId(), 6, -1, 0, 0) // Shoes
    SetPedComponentVariation(PlayerPedId(), 9, 0, 0, 0) // Armor
    SetPedComponentVariation(PlayerPedId(), 3, -1, 0, 0) // Torso
    SetPedComponentVariation(PlayerPedId(), 8, -1, 0, 0) // Undershirt
    SetPedComponentVariation(PlayerPedId(), 4, -1, 0, 0) // Legs
    SetPedComponentVariation(PlayerPedId(), 11, -1, 0, 0) // Top
    SetPedHairColor(PlayerPedId(), 45, 15)
  } else {
    SetPedHeadBlendData(45, 45, 45, 31, 31, 31, 1, 1, 1)
    SetPedComponentVariation(PlayerPedId(), 0, 0, 1, 0) // Head
    SetPedComponentVariation(PlayerPedId(), 1, 0, 0, 0) // Mask
    SetPedComponentVariation(PlayerPedId(), 2, -1, 0, 0) // Hair
    SetPedComponentVariation(PlayerPedId(), 5, 0, 0, 0) // Bags
    SetPedComponentVariation(PlayerPedId(), 9, 0, 0, 0) // Armor
    SetPedComponentVariation(PlayerPedId(), 7, 0, 0, 0) // Accessories
    SetPedComponentVariation(PlayerPedId(), 6, -1, 0, 0) // Shoes
    SetPedComponentVariation(PlayerPedId(), 3, -1, 0, 0) // Torso
    SetPedComponentVariation(PlayerPedId(), 8, -1, 0, 0) // Undershirt
    SetPedComponentVariation(PlayerPedId(), 4, -1, 0, 0) // Legs
    SetPedComponentVariation(PlayerPedId(), 11, -1, 0, 0) // Top
    SetPedHairColor(PlayerPedId(), 45, 15)
  }
  ClearAllPedProps()
}

RegisterCommand('screenshot', async (source, args) => {
  const modelHashes = [
    GetHashKey('mp_m_freemode_01'),
    GetHashKey('mp_f_freemode_01')
  ]

  sendNuiMessage({
    start: true
  })

  if (GetResourceState('qb-weathersync') == 'started' || GetResourceState('weathersync') == 'started' || GetResourceState('esx_wsync') == 'started' || GetResourceState('cd_easytime') == 'started' || GetResourceState('Renewed-Weathersync') == 'started') {
    sendNuiMessage({
      error: 'weathersync'
    })
    return
  }

  NetworkOverrideClockTime(14, 0, 0)
  NetworkOverrideClockMillisecondsPerGameMinute(1000000)
  SetWeatherTypeNow('EXTRASUNNY')

  await Delay(100)

  for (const modelHash of modelHashes) {
    if (IsModelInCdimage(modelHash)) {
      RequestModel(modelHash)
      while (!HasModelLoaded(modelHash)) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const pedType =
        modelHash === GetHashKey('mp_m_freemode_01') ? 'male' : 'female'

      SetEntityRotation(
        PlayerPedId(),
        config.greenScreenRotation.x,
        config.greenScreenRotation.y,
        config.greenScreenRotation.z,
        0,
        false
      )

      SetEntityCoordsNoOffset(
        PlayerPedId(),
        config.greenScreenPosition.x,
        config.greenScreenPosition.y,
        config.greenScreenPosition.z,
        false,
        false,
        false
      )

      await Delay(50)

      SetPlayerModel(PlayerId(), modelHash)

      await Delay(15)

      if (config.includeTextures) {
        for (const type of Object.keys(config.cameraSettings)) {
          for (const stringComponent of Object.keys(
            config.cameraSettings[type]
          )) {
            ResetPed(pedType)
            const component = parseInt(stringComponent)
            if (type === 'CLOTHING') {
              const drawableVariationCount = GetNumberOfPedDrawableVariations(
                PlayerPedId(),
                component
              )
              for (
                let drawable = 0;
                drawable < drawableVariationCount;
                drawable++
              ) {
                const textureVariationCount = GetNumberOfPedTextureVariations(
                  PlayerPedId(),
                  component,
                  drawable
                )
                sendNuiMessage({
                  type: config.cameraSettings[type][component].name,
                  value: drawable,
                  max: drawableVariationCount
                })
                for (
                  let texture = 0;
                  texture < textureVariationCount;
                  texture++
                ) {
                  SetPedComponentVariation(
                    PlayerPedId(),
                    component,
                    drawable,
                    texture,
                    0
                  )
                  await takeScreenshotForComponent(
                    pedType,
                    type,
                    component,
                    drawable,
                    texture
                  )
                }
              }
            } else if (type === 'PROPS') {
              const propVariationCount = GetNumberOfPedPropDrawableVariations(
                PlayerPedId(),
                component
              )
              for (let prop = 0; prop < propVariationCount; prop++) {
                const textureVariationCount =
                  GetNumberOfPedPropTextureVariations(
                    PlayerPedId(),
                    component,
                    prop
                  )
                sendNuiMessage({
                  type: config.cameraSettings[type][component].name,
                  value: prop,
                  max: propVariationCount
                })
                for (
                  let texture = 0;
                  texture < textureVariationCount;
                  texture++
                ) {
                  ClearPedProp(PlayerPedId(), component)
                  SetPedPropIndex(PlayerPedId(), component, prop, texture, 0)
                  await takeScreenshotForComponent(
                    pedType,
                    type,
                    component,
                    prop,
                    texture
                  )
                }
              }
            }
          }
        }

        SetModelAsNoLongerNeeded(modelHash)
        return
      }

      for (const type of Object.keys(config.cameraSettings)) {
        for (const stringComponent of Object.keys(
          config.cameraSettings[type]
        )) {
          ResetPed(pedType)
          const component = parseInt(stringComponent)
          if (type === 'CLOTHING') {
            const drawableVariationCount = GetNumberOfPedDrawableVariations(
              PlayerPedId(),
              component
            )
            for (
              let drawable = 0;
              drawable < drawableVariationCount;
              drawable++
            ) {
              sendNuiMessage({
                type: config.cameraSettings[type][component].name,
                value: drawable,
                max: drawableVariationCount
              })
              SetPedComponentVariation(PlayerPedId(), component, drawable, 0, 0)
              await takeScreenshotForComponent(
                pedType,
                type,
                component,
                drawable
              )
            }
          } else if (type === 'PROPS') {
            const propVariationCount = GetNumberOfPedPropDrawableVariations(
              PlayerPedId(),
              component
            )
            for (let prop = 0; prop < propVariationCount; prop++) {
              sendNuiMessage({
                type: config.cameraSettings[type][component].name,
                value: prop,
                max: propVariationCount
              })
              ClearPedProp(PlayerPedId(), component)
              SetPedPropIndex(PlayerPedId(), component, prop, 0, 0)
              await takeScreenshotForComponent(pedType, type, component, prop)
            }
          }
        }
      }

      SetModelAsNoLongerNeeded(modelHash)

      sendNuiMessage({
        end: true
      })
    }
  }
})
