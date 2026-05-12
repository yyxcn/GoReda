"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { VALIDATORS, type ValidatorNode } from "./constants";

interface ValidatorContextValue {
  validators: ValidatorNode[];
  addValidator: (node: ValidatorNode) => void;
}

const ValidatorContext = createContext<ValidatorContextValue>({
  validators: VALIDATORS,
  addValidator: () => {},
});

export function ValidatorProvider({ children }: { children: React.ReactNode }) {
  const [validators, setValidators] = useState<ValidatorNode[]>(VALIDATORS);

  const addValidator = useCallback((node: ValidatorNode) => {
    setValidators((prev) => [...prev, node]);
  }, []);

  return (
    <ValidatorContext.Provider value={{ validators, addValidator }}>
      {children}
    </ValidatorContext.Provider>
  );
}

export function useValidators() {
  return useContext(ValidatorContext);
}
