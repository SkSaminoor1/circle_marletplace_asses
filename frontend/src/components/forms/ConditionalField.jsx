import React from 'react';

/**
 * Check if the visibility conditions for a field are satisfied by the current form values.
 * Returns true if all conditions pass, or if there are no conditions.
 */
export const checkConditionSatisfied = (conditions, formValues) => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((cond) => {
    const depKey = cond.depends_on_key;
    const depValue = formValues[depKey];

    if (depValue === undefined || depValue === null) {
      return false; // Dependent field is not filled yet
    }

    const depStr = String(depValue).toLowerCase().trim();
    const condStr = String(cond.value).toLowerCase().trim();

    switch (cond.operator) {
      case 'equals':
        return depStr === condStr;
      case 'not_equals':
        return depStr !== condStr;
      case 'contains':
        return depStr.includes(condStr);
      case 'not_contains':
        return !depStr.includes(condStr);
      case 'greater_than':
        return parseFloat(depStr) > parseFloat(condStr);
      case 'less_than':
        return parseFloat(depStr) < parseFloat(condStr);
      default:
        return true;
    }
  });
};

export default function ConditionalField({ field, formValues, children }) {
  const isVisible = checkConditionSatisfied(field.conditions, formValues);

  if (!isVisible) {
    return null;
  }

  return <div className="animate-fade-in w-full">{children}</div>;
}
