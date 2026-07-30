"use client";

import React from "react";
import Icon from "../Icon/Icon";
import styles from "./Stepper.module.css";

export interface Step {
  label: string;
  description?: string;
  subDescription?: string;
  status: "completed" | "active" | "pending";
  icon?: string;
  warningBadge?: string;
}

export interface StepperProps {
  steps: Step[];
}

export default function Stepper({ steps }: StepperProps) {
  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        const nextStep = steps[index + 1];
        const isLineActive = nextStep && (nextStep.status === "completed" || nextStep.status === "active");

        return (
          <React.Fragment key={index}>
            <div className={`${styles.step} ${styles[step.status]}`}>
              <div className={styles.stepIcon}>
                {step.icon ? <Icon name={step.icon} /> : <span>{index + 1}</span>}
                {step.status === "completed" && (
                  <div className={styles.checkBadge}>
                    <Icon name="check" size={12} />
                  </div>
                )}
              </div>
              <div className={styles.stepInfo}>
                <strong>{step.label}</strong>
                {step.description && <span>{step.description}</span>}
                {step.warningBadge ? (
                  <span className={styles.warningBadgeHint}>{step.warningBadge}</span>
                ) : (
                  step.subDescription && <small>{step.subDescription}</small>
                )}
              </div>
            </div>
            {!isLast && (
              <div className={`${styles.stepLine} ${isLineActive ? styles.lineActive : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
