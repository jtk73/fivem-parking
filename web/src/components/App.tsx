import { Divider, Tooltip, Transition } from '@mantine/core';
import debounce from 'debounce';
import { ParkingSquare, RefreshCw, X } from 'lucide-react';
import React, { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react';
import { useExitListener } from '../hooks/useExitListener';
import { useNuiEvent } from '../hooks/useNuiEvent';
import Garage from '../icons/garage.svg';
import Tow from '../icons/tow.svg';
import { Options } from '../types/Options';
import { Vehicle } from '../types/Vehicle';
import { debugData } from '../utils/debugData';
import { fetchNui } from '../utils/fetchNui';
import Button from './Main/Button';
import HeaderText from './Main/header-text';
import SearchPopover from './Main/search-popover';
import VehicleContainer from './Main/vehicle-container';

debugData([
  {
    action: 'setVisible',
    data: {
      visible: true,
    },
  },
]);

debugData([
  {
    action: 'bgarage:nui:setVehicles',
    data: Array.from(
      { length: 30 },
      (
        _: unknown,
        index: number
      ): {
        owner: string | number;
        model: string | number;
        plate: string;
        modelName: string;
        location: string;
        type: string;
        temporary: boolean;
      } => ({
        owner: 'vipex',
        model: `${index}`,
        plate: `Plate ${index}`,
        modelName: `Car ${index}`,
        location: Math.random() >= 0.5 ? 'parked' : 'impound',
        type: 'car',
        temporary: false,
      })
    ),
  },
]);

interface Tabs {
  [key: string]: JSX.Element;
}

export interface AppContextType {
  options: Options;
  setOptions: Dispatch<SetStateAction<Options>>;
}

export const AppContext: React.Context<AppContextType | undefined> = createContext<AppContextType | undefined>(
  undefined
);

const App: React.FC = React.memo(() => {
  const [visible, setVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState('Garage');
  const [vehicles, setVehicles] = useState<Vehicle[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [impoundOpen, setImpoundState] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[] | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<Options>({
    usingGrid: true,
  });

  useNuiEvent('setVisible', (data: { visible: boolean; impoundOpen: boolean }): void => {
    setVisible(data.visible);
    setImpoundState(data.impoundOpen);
  });

  // Listening for an exit key, as of currently ["Escape"] only.
  useExitListener(setVisible);

  useNuiEvent('bgarage:nui:setVehicles', setVehicles);

  useNuiEvent('bgarage:nui:state:setOptions', setOptions);

  // Looks horrible, needs to be re-written in the future.
  const tabs: Tabs = {
    Garage: (
      <>
        {Object.values(vehicles ?? {}).filter((vehicle: Vehicle): boolean => vehicle.location !== 'impound').length >
        0 ? (
          <>
            <div className="">
              <VehicleContainer
                impoundOpen={impoundOpen}
                vehicles={
                  searchQuery.length > 0
                    ? filteredVehicles ?? []
                    : Object.values(vehicles ?? {}).filter(
                        (vehicle: Vehicle): boolean => vehicle.location !== 'impound'
                      )
                }
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center font-inter">Empty.</div>
        )}
      </>
    ),
    Impound: (
      <>
        {Object.values(vehicles ?? {}).filter((vehicle: Vehicle): boolean => vehicle.location === 'impound').length >
        0 ? (
          <VehicleContainer
            impoundOpen={impoundOpen}
            vehicles={
              searchQuery.length > 0
                ? filteredVehicles ?? []
                : Object.values(vehicles ?? {}).filter((vehicle: Vehicle): boolean => vehicle.location === 'impound')
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-inter">Empty.</div>
        )}
      </>
    ),
  };

  useEffect((): void => {
    fetchNui('bgarage:nui:saveSettings', options);
  }, [options]);

  const handleButtonClick: (tab: string) => void = (tab: string): void => {
    if (!loading) {
      setLoading(true);
      setCurrentTab(tab);
      setSearchQuery('');
      setFilteredVehicles(undefined);
      setTimeout((): void => {
        setLoading(false);
      }, 500);
    }
  };

  const filterVehicles: () => void = (): void => {
    const filterVehicles: (data: Vehicle[], query: string) => Vehicle[] = (
      data: Vehicle[],
      query: string
    ): Vehicle[] => {
      return data
        ? Object.values(data).filter((vehicle: Vehicle): boolean => {
            const queryLower: string = query.toLowerCase();
            return vehicle.modelName.toLowerCase().includes(queryLower) || vehicle.plate.includes(queryLower);
          })
        : [];
    };

    const vehiclesToQuery: Vehicle[] = Object.values(vehicles ?? []).filter((vehicle: Vehicle): boolean =>
      currentTab === 'Garage' ? vehicle.location !== 'impound' : vehicle.location === 'impound'
    );

    setFilteredVehicles(filterVehicles(vehiclesToQuery ?? [], searchQuery));

    setLoading(false);
  };

  const debouncedOnChange: debounce.DebouncedFunction<() => void> = debounce(filterVehicles, 500);

  const handleSearchInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value: string = event.target.value;
    setSearchQuery(value);
    debouncedOnChange();
    setLoading(true);
  };

  return (
    <AppContext.Provider
      value={{
        options: options,
        setOptions: setOptions,
      }}
    >
      <Transition mounted={visible} transition={'pop'} timingFunction="ease" duration={400}>
        {(styles: React.CSSProperties) => {
          return (
            <div className="flex w-[100dvw] h-[100dvh] justify-center items-center" style={styles}>
              <div className="bg-[#25262b] h-[65dvh] w-[50dvw] px-4 py-1 rounded-[2px] overflow-hidden">
                <header className="flex items-center justify-center font-main mb-1 text-blue text-xl">
                  <HeaderText Icon={ParkingSquare} className="mr-auto" size={20} />
                  <div className="flex gap-2 mr-auto">
                    <Tooltip
                      label="Stored Vehicles"
                      classNames={{
                        tooltip: '!bg-[#1a1b1e] font-inter text-white rounded-[2px]',
                      }}
                    >
                      <div>
                        <Button
                          svg={Garage}
                          disabled={impoundOpen}
                          className={`${currentTab === 'Garage' && 'border-blue'} is-dirty`}
                          onClick={(): void => {
                            handleButtonClick('Garage');
                          }}
                        />
                      </div>
                    </Tooltip>
                    <Tooltip
                      label="Impounded Vehicles"
                      classNames={{
                        tooltip: '!bg-[#1a1b1e] font-inter text-white rounded-[2px]',
                      }}
                    >
                      <div>
                        <Button
                          svg={Tow}
                          className={`${currentTab === 'Impound' && 'border-blue'}`}
                          onClick={(): void => {
                            handleButtonClick('Impound');
                          }}
                        />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="flex items-center">
                    <SearchPopover onChange={handleSearchInputChange} className="" />
                    <Button
                      className={`hover:bg-transparent hover:text-red transition-all text-red rounded text-white !px-2 !py-[7px]`}
                      size={16}
                      Icon={X}
                      onClick={(): void => {
                        fetchNui('bgarage:nui:hideFrame');
                      }}
                    />
                  </div>
                  {/* <Button
                  className={`hover:border-blue !px-2 !py-[7px] rounded-[2px]`}
                  size={16}
                  Icon={Cog}
                  /> */}
                </header>

                <Divider />

                {loading ? (
                  <>
                    <div className="w-full h-full flex justify-center items-center">
                      <RefreshCw className="text-blue animate-spin" size={20} strokeWidth={2.5} />
                    </div>
                  </>
                ) : (
                  <>{tabs[currentTab]}</>
                )}
              </div>
            </div>
          );
        }}
      </Transition>
    </AppContext.Provider>
  );
});

export default App;
