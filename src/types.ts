interface FormField {
    id: string;
    type: 'text' | 'radio' | 'checkbox';
    label: string;
    options?: string[];
    required: boolean;
}

interface Form {
    id: string;
    title: string;
    fields: FormField[];
}

interface FormResponse {
    formId: string;
    timestamp: number;
    answers: {
        [fieldId: string]: string | string[];
    };
}