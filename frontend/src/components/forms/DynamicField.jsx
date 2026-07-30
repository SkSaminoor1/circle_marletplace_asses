import TextField from './TextField';
import TextareaField from './TextareaField';
import NumberField from './NumberField';
import SelectField from './SelectField';
import RadioField from './RadioField';
import CheckboxField from './CheckboxField';
import BooleanField from './BooleanField';
import DateField from './DateField';
import ConditionalField from './ConditionalField';

export default function DynamicField({ field, value, onChange, error, formValues }) {
  const renderField = () => {
    switch (field.field_type) {
      case 'text':
        return <TextField field={field} value={value} onChange={onChange} error={error} />;
      case 'textarea':
        return <TextareaField field={field} value={value} onChange={onChange} error={error} />;
      case 'number':
        return <NumberField field={field} value={value} onChange={onChange} error={error} />;
      case 'select':
        return <SelectField field={field} value={value} onChange={onChange} error={error} />;
      case 'radio':
        return <RadioField field={field} value={value} onChange={onChange} error={error} />;
      case 'checkbox':
        return <CheckboxField field={field} value={value} onChange={onChange} error={error} />;
      case 'boolean':
        return <BooleanField field={field} value={value} onChange={onChange} error={error} />;
      case 'date':
        return <DateField field={field} value={value} onChange={onChange} error={error} />;
      default:
        return (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Unsupported field type: <strong>{field.field_type}</strong>
          </div>
        );
    }
  };

  return (
    <ConditionalField field={field} formValues={formValues}>
      {renderField()}
    </ConditionalField>
  );
}
