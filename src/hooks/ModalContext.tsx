import { createContext, useContext, useState } from "react";
import type { ModalType, TabSection } from "../models/Modal";

type ModalContextType = {
  showModal: (
    type: ModalType,
    options?: { tab?: TabSection; view?: "participants" },
  ) => void;
  closeModal: () => void;
  modalType: ModalType;
  initialTab?: TabSection;
  initialView?: "participants";
};

const ModalContext = createContext<ModalContextType | null>(null);

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("ModalContext not available");
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>("none");
  const [initialTab, setInitialTab] = useState<TabSection>("Volume");
  const [initialView, setInitialView] = useState<"participants" | undefined>();

  const showModal = (
    type: ModalType,
    options?: { tab?: TabSection; view?: "participants" },
  ) => {
    setModalType(type);
    if (options?.tab) setInitialTab(options.tab);
    // Always set: a stale deep-link must not survive the next plain open
    setInitialView(options?.view);
  };

  const closeModal = () => setModalType("none");

  return (
    <ModalContext.Provider
      value={{ showModal, closeModal, modalType, initialTab, initialView }}
    >
      {children}
    </ModalContext.Provider>
  );
}
