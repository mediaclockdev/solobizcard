"use client";
import React from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function CardDesignSelection({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const currentTemplate = card.templateType || "classic";
  const isDisabled = !isEditMode;
  const renderClassicDesigns = () => (
    <>
      {/* Standard */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "standard" ||
                (!card.cardLayout && currentTemplate === "classic")
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Standard</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Standard
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute bottom-5 right-3 w-1/4 aspect-video rounded-xl bg-gray-200 translate-y-4"
                      style={{ bottom: 4 }}
                    ></div>

                    {/* Circle left */}
                    <div className="absolute bottom-0 left-3 translate-y-[38%]">
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "standard" ||
        //     (!card.cardLayout && currentTemplate === "classic")
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-6 left-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Standard</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "standard" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "standard" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 font-medium text-black">Standard</p>
          <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
            <div
              className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container"
              data-id="card-container"
              data-template="classic"
            >
              <div className="flex flex-col relative items-center justify-center bg-white">
                <div className="relative bg-white">
                  <div className="relative">
                    <div
                      className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                      style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                    ></div>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                  </div>

                  <div className="px-6">
                    <div
                      className="border-[6px] border-white left-10 object-cover absolute w-28 h-28 rounded-full bottom-0 translate-y-1/2"
                      style={{
                        backgroundColor: card.brandColor || "#99b2ff",
                      }}
                    ></div>
                    <div
                      className="absolute bottom-0 right-10 translate-y-1/2 w-28 h-16 rounded-xl object-cover"
                      style={{
                        backgroundColor: "#ccc",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start bg-white p-6 pb-0 pt-20">
                <div className="flex flex-col gap-1 items-start justify-start">
                  <div
                    className="flex items-end flex-wrap justify-start gap-2 mb-2 gap-y-1 text-3xl font-bold"
                    data-id="name"
                  >
                    <div className="flex items-center gap-1 flex-wrap mb-1"></div>
                  </div>
                  <div className="text-xl"></div>
                  <div className="text-xl font-light"></div>
                  <div className="text-md text-gray-500 mt-2"></div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                <div
                  data-rfd-droppable-id="links"
                  className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extended */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "extended"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 right-2 w-1.5 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-7 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-6 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Extended</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Extended
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    {/* <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div> */}
                    <div
                      className="absolute bottom-5 left-3 w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{ bottom: -9 }}
                    ></div>
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "extended"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 right-2 w-1.5 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-7 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-6 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Extended</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "extended" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "extended" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 font-medium text-black">Extended</p>
          <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
            <div
              className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container"
              data-id="card-container"
              data-template="classic"
            >
              <div className="flex flex-col relative items-center justify-center bg-white">
                <div className="relative bg-white">
                  <div className="relative">
                    <div
                      className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                      style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                    ></div>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                  </div>

                  <div className="px-6">
                    <div
                      className="border-[6px] aspect-[1/1] border-white object-cover w-28 absolute rounded-full bottom-0 right-10 translate-y-1/2"
                      style={{
                        backgroundColor: card.brandColor || "#99b2ff",
                        aspectRatio: "1 / 1",
                      }}
                    ></div>
                    <div
                      className="object-cover absolute top-6 left-10 w-28 rounded-xl aspect-[16/9] left-10"
                      style={{
                        backgroundColor: "#ccc",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                <div
                  data-rfd-droppable-id="links"
                  className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                ></div>
              </div>
              <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                <div
                  data-rfd-droppable-id="links"
                  className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "centered"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
                    <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-3 flex flex-col items-center">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                      <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Centered</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Centered
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}90`,
                      }}
                    ></div>
                    <div
                      className="absolute w-1/4 aspect-video rounded-xl bg-gray-200"
                      style={{
                        bottom: -22,
                        right: 35,
                        zIndex: 99999999,
                      }}
                    ></div>
                    {/* Circle right */}
                    <div
                      className="absolute bottom-0 right-3 translate-y-[38%]"
                      style={{ right: 50 }}
                    >
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid #FFF`,
                          backgroundColor: `${card.brandColor}90`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "centered"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="absolute top-5 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-3 flex flex-col items-center">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //           <div className="w-4 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Centered</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "centered" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "centered" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <p className="text-center mb-2 font-medium text-gray-500">Centered</p>
          <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
            <div
              className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container"
              data-id="card-container"
              data-template="classic"
              style={{ minWidth: "384px" }}
            >
              <div className="flex flex-col relative items-center justify-center bg-white">
                <div className="relative bg-white">
                  <div className="relative">
                    <div
                      className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[250px]"
                      style={{ backgroundColor: card.brandColor || "#99b2ff" }}
                    ></div>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="px-6">
                    <div
                      className="border-[6px] border-white object-cover w-28 absolute rounded-full bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2"
                      style={{
                        backgroundColor: card.brandColor || "#99b2ff",
                        aspectRatio: "1 / 1",
                      }}
                    ></div>

                    <div
                      className="object-cover absolute -bottom-16 left-1/2 translate-x-[20%] w-16 rounded-xl"
                      style={{
                        backgroundColor: "#ccc",
                        aspectRatio: "16 / 9",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                <div
                  data-rfd-droppable-id="links"
                  className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                ></div>
              </div>

              <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                <div
                  data-rfd-droppable-id="links"
                  className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portrait */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "portrait"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "cursor-not-allowed" : ""}`}

              // className={`p-1 rounded-lg transition-all ${
              //   card.cardLayout === "portrait"
              //     ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
              //     : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
              // } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-9 h-12 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
                    <div className="space-y-0.5">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Portrait</span>
              </div> */}
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Portrait
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        // borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>

                    {/* No circle for portrait */}
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "portrait"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-9 h-12 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="space-y-0.5">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Portrait</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "portrait" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[200px] transition-all duration-300">
            <p className="text-center mb-2 font-medium text-gray-500">
              Portrait
            </p>
            <div
              className="w-[400px] h-[200px] transform origin-top-left"
              style={{ transform: "scale(0.5) scaleY(0.75)" }}
            >
              <div
                className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl card-container"
                data-id="card-container"
                data-template="classic"
              >
                <div className="flex flex-col relative items-center justify-center bg-white">
                  <div className="relative bg-white">
                    <div className="relative">
                      <div
                        className="relative w-full aspect-[16/9] bg-[#FFD93D] h-[400px]"
                        style={{
                          backgroundColor: card.brandColor || "#99b2ff",
                        }}
                      ></div>
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="px-6"></div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
                <div className="flex flex-col items-start justify-start bg-white py-6 px-3 pt-2">
                  <div
                    data-rfd-droppable-id="links"
                    className="flex flex-col items-start justify-start w-full gap-2 min-h-[50px] transition-all duration-200 bg-transparent py-2 w-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
  const hexToRgba = (hex, alpha = 0.2) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderTraditionalDesigns = () => (
    <>
      {/* Align Right */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "align-right" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "align-right" ||
                (!card.cardLayout && currentTemplate === "traditional")
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 right-2 w-3 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2 ml-1">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Align Right</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Align Right
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>
                    <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div>
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "align-right" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "align-right" ||
        //     (!card.cardLayout && currentTemplate === "traditional")
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 right-2 w-3 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2 ml-1">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Align Right</span>
        //   </div>
        // </button>
        <div
          onClick={() => {
            !isDisabled && onUpdate({ ...card, cardLayout: "align-right" });
            console.log("hgihi");
          }}
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "align-right" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[200px] transition-all duration-300">
            <p className="text-center mb-2 font-medium text-gray-500">
              Align Right
            </p>
            <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
              <div
                className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white"
                data-template="traditional"
              >
                <div className="relative h-64">
                  <div
                    className="w-full h-full object-cover"
                    style={{
                      aspectRatio: "4 / 3",
                      borderBottom: `20px solid ${card.brandColor}`,
                      backgroundColor: `${card.brandColor}80`,
                    }}
                  />
                  <div className="absolute top-6 left-6">
                    <div
                      className="w-28 rounded-lg object-cover"
                      style={{
                        aspectRatio: "16 / 9",
                        backgroundColor: "#eee",
                      }}
                    />
                  </div>
                  <div className="absolute bottom-4 right-6 translate-y-1/2">
                    <div
                      className={`
                          w-28 h-28 rounded-full object-cover
                          ${
                            card.templateType === "traditional"
                              ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                              : ""
                          }
                        `}
                      style={{
                        border: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-12 pb-8">
                  <div className="text-left mb-2 px-6">
                    <div className="flex items-end flex-wrap justify-start mb-2">
                      <h2 className="text-3xl font-bold"></h2>
                      <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                    </div>
                    <p className="text-xl text-gray-600 mb-1"></p>
                    <p className="text-gray-600 text-xl"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Align Left */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "align-left"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : " opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-4 left-2 w-3 h-1 bg-white/80 rounded-sm"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2 mr-1">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Align Left</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Align Left
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>
                    <div className="absolute top-3 right-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div>
                    {/* Circle left */}
                    <div className="absolute bottom-0 left-3 translate-y-[38%]">
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "align-left"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-4 left-2 w-3 h-1 bg-white/80 rounded-sm"></div>
        //         <div className="absolute bottom-2 left-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2 mr-1">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Align Left</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "align-left" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "align-left" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[200px] transition-all duration-300">
            <p className="text-center mb-2 font-medium text-gray-500">
              Align Left
            </p>
            <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
              <div
                className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white"
                data-template="traditional"
              >
                <div className="relative h-64">
                  <div
                    className="w-full h-full object-cover"
                    style={{
                      aspectRatio: "4 / 3",
                      borderBottom: `20px solid ${card.brandColor}`,
                      backgroundColor: `${card.brandColor}80`,
                    }}
                  />
                  <div className="absolute top-6 right-6">
                    <div
                      className="w-28 rounded-lg object-cover"
                      style={{
                        aspectRatio: "16 / 9",
                        backgroundColor: "#eee",
                      }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-6 translate-y-1/2">
                    <div
                      className={`
                          w-28 h-28 rounded-full object-cover
                          ${
                            card.templateType === "traditional"
                              ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                              : ""
                          }
                        `}
                      style={{
                        border: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-12 pb-8">
                  <div className="text-left mb-2 px-6">
                    <div className="flex items-end flex-wrap justify-start mb-2">
                      <h2 className="text-3xl font-bold"></h2>
                      <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                    </div>
                    <p className="text-xl text-gray-600 mb-1"></p>
                    <p className="text-gray-600 text-xl"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portrait */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "portrait"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "cursor-not-allowed" : ""}`}
            >
              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Portrait
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>

                    {/* No circle for portrait */}
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "portrait"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-9 h-12 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-4 w-full bg-white flex flex-col items-center justify-center">
        //         <div className="space-y-0.5">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Portrait</span>
        //   </div>
        // </button>

        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "portrait" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "portrait" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[200px] transition-all duration-300">
            <p className="text-center mb-2 font-medium text-gray-500">
              Portrait
            </p>
            <div className="w-[200px] h-[200px] relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-[400px] origin-top-left"
                style={{ transform: "scale(0.5) scaleY(0.74)" }}
              >
                <div
                  className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white"
                  data-template="traditional"
                  style={{ minWidth: "384px" }}
                >
                  <div className="relative h-96">
                    <div
                      className="w-full h-full object-cover"
                      style={{
                        aspectRatio: "1 / 1",
                        borderBottom: `20px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                  </div>
                  <div className="pt-12 pb-8">
                    <div className="text-left mb-2 px-6">
                      <div className="flex items-end flex-wrap justify-start mb-2">
                        <h2 className="text-3xl font-bold"></h2>
                        <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                      </div>
                      <p className="text-xl text-gray-600 mb-1"></p>
                      <p className="text-gray-600 text-xl"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slides */}
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
              }
              disabled={isDisabled}
              className={`p-1 rounded-lg transition-all ${
                card.cardLayout === "slides"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
                  : "opacity-50 hover:opacity-70"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-16 rounded overflow-hidden relative">
                  <div
                    className="h-8 w-full"
                    style={{ backgroundColor: card.brandColor }}
                  ></div>
                  <div className="h-8 w-full bg-white flex items-center justify-center">
                    <div className="absolute top-5 left-2 flex space-x-0.5">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    </div>
                    <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="space-y-0.5 mt-2">
                      <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
                      <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Slides</span>
              </div> */}

              <div className="cursor-pointer transition-all duration-300">
                <p className="text-center mb-2 font-medium text-gray-500 text-sm md:text-base">
                  Slides
                </p>
                <div className="card-container rounded-xl overflow-hidden shadow-2xl bg-white relative cursor-not-allowed">
                  <div className="relative w-full aspect-[4/3]">
                    <div
                      className="w-full h-full"
                      style={{
                        borderBottom: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    ></div>
                    {/* <div className="absolute top-3 left-3 w-1/4 aspect-video rounded-lg bg-gray-200"></div> */}
                    {/* Circle right */}
                    <div className="absolute bottom-0 right-3 translate-y-[38%]">
                      <div
                        className="w-7 aspect-square rounded-full relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white before:rounded-full before:-z-10"
                        style={{
                          border: `3px solid ${card.brandColor}`,
                          backgroundColor: `${card.brandColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-6 pb-6 px-4">
                    <h2 className="text-lg md:text-xl font-bold mb-1"></h2>
                  </div>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Available when editing a card only.</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        // <button
        //   onClick={() =>
        //     !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
        //   }
        //   disabled={isDisabled}
        //   className={`p-4 rounded-lg border-2 transition-all ${
        //     card.cardLayout === "slides"
        //       ? "border-[var(--primary)] bg-[var(--primary)]/10 -translate-y-3 scale-105"
        //       : "border-border hover:border-muted-foreground opacity-50 hover:opacity-70"
        //   } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // >
        //   <div className="flex flex-col items-center space-y-2">
        //     <div className="w-12 h-16 rounded overflow-hidden relative">
        //       <div
        //         className="h-8 w-full"
        //         style={{ backgroundColor: card.brandColor }}
        //       ></div>
        //       <div className="h-8 w-full bg-white flex items-center justify-center">
        //         <div className="absolute top-5 left-2 flex space-x-0.5">
        //           <div className="w-1 h-1 bg-white rounded-full"></div>
        //           <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        //           <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        //         </div>
        //         <div className="absolute top-6 right-2 w-2 h-2 bg-white rounded-full"></div>
        //         <div className="space-y-0.5 mt-2">
        //           <div className="w-6 h-0.5 bg-foreground/60 rounded-sm"></div>
        //           <div className="w-5 h-0.5 bg-foreground/40 rounded-sm"></div>
        //         </div>
        //       </div>
        //     </div>
        //     <span className="text-xs font-medium">Slides</span>
        //   </div>
        // </button>
        <div
          onClick={() =>
            !isDisabled && onUpdate({ ...card, cardLayout: "slides" })
          }
          className={`cursor-pointer shrink-0 w-[200px] transition-all duration-300 
            ${
              card.cardLayout === "slides" ||
              (!card.cardLayout && currentTemplate === "classic")
                ? "bg-[var(--primary)]/10 -translate-y-3 scale-105"
                : "opacity-50 hover:opacity-70"
            } 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="cursor-pointer shrink-0 w-[200px] transition-all duration-300">
            <p className="text-center mb-2 font-medium text-gray-500">Slides</p>
            <div className="w-[400px] h-[200px] transform scale-50 origin-top-left">
              <div
                className="max-w-md w-full card-container rounded-xl overflow-hidden shadow-2xl bg-white"
                data-template="traditional"
                style={{ minWidth: "384px" }}
              >
                <div className="relative h-64">
                  <div
                    className="w-full h-full object-cover"
                    style={{
                      aspectRatio: "4 / 3",
                      borderBottom: `20px solid ${card.brandColor}`,
                      backgroundColor: `${card.brandColor}80`,
                    }}
                  />

                  <div className="absolute bottom-4 right-6 translate-y-1/2">
                    <div
                      className={`
                          w-28 h-28 rounded-full object-cover
                          ${
                            card.templateType === "traditional"
                              ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                              : ""
                          }
                        `}
                      style={{
                        border: `6px solid ${card.brandColor}`,
                        backgroundColor: `${card.brandColor}80`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-12 pb-8">
                  <div className="text-left mb-2 px-6">
                    <div className="flex items-end flex-wrap justify-start mb-2">
                      <h2 className="text-3xl font-bold"></h2>
                      <div className="flex items-center gap-1 flex-wrap mb-1 ml-2"></div>
                    </div>
                    <p className="text-xl text-gray-600 mb-1"></p>
                    <p className="text-gray-600 text-xl"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Card Design</Label>
        {/* grid grid-cols-2 md:grid-cols-4 gap-6 py-8 */}
        <div
          className={
            isDisabled
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-0"
              : " flex gap-6 py-8 flex-wrap"
          }
        >
          {currentTemplate === "classic"
            ? renderClassicDesigns()
            : renderTraditionalDesigns()}
        </div>
      </div>
    </TooltipProvider>
  );
}

// flex gap-6 py-8 flex-wrap
