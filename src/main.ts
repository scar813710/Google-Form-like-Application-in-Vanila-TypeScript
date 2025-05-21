class FormBuilder {
    private currentForm: Form | null = null;
    private forms: Form[] = [];
    private responses: FormResponse[] = [];

    constructor() {
        this.loadFromStorage();
        this.initializeEventListeners();
        (window as any).formBuilder = this;
    }

    private loadFromStorage(): void {
        const storedForms = localStorage.getItem('forms');
        const storedResponses = localStorage.getItem('responses');
        
        if (storedForms) {
            this.forms = JSON.parse(storedForms);
        }
        
        if (storedResponses) {
            this.responses = JSON.parse(storedResponses);
        }
    }

    private saveToStorage(): void {
        localStorage.setItem('forms', JSON.stringify(this.forms));
        localStorage.setItem('responses', JSON.stringify(this.responses));
    }

    private initializeEventListeners(): void {
        const createFormBtn = document.getElementById('createFormBtn');
        const viewFormsBtn = document.getElementById('viewFormsBtn');
        const addFieldBtn = document.getElementById('addFieldBtn');
        const saveFormBtn = document.getElementById('saveFormBtn');
        const submitFormBtn = document.getElementById('submitFormBtn');

        createFormBtn?.addEventListener('click', () => this.showFormBuilder());
        viewFormsBtn?.addEventListener('click', () => this.showFormsList());
        addFieldBtn?.addEventListener('click', () => this.addField());
        saveFormBtn?.addEventListener('click', () => this.saveForm());
        submitFormBtn?.addEventListener('click', () => this.submitForm());
    }

    private showFormBuilder(): void {
        this.hideAllSections();
        this.currentForm = {
            id: crypto.randomUUID(),
            title: '',
            fields: []
        };
        document.getElementById('formBuilder')?.classList.remove('hidden');
    }

    private showFormsList(): void {
        this.hideAllSections();
        const formsContainer = document.getElementById('formsContainer');
        if (formsContainer) {
            formsContainer.innerHTML = '';
            this.forms.forEach(form => {
                const formCard = document.createElement('div');
                formCard.className = 'form-card';
                formCard.innerHTML = `
                    <h3>${form.title}</h3>
                    <div class="field-actions">
                        <button onclick="formBuilder.previewForm('${form.id}')">Preview</button>
                        <button onclick="formBuilder.editForm('${form.id}')">Edit</button>
                        <button onclick="formBuilder.deleteForm('${form.id}')">Delete</button>
                        <button onclick="formBuilder.viewResponses('${form.id}')">Responses</button>
                    </div>
                `;
                formsContainer.appendChild(formCard);
            });
        }
        document.getElementById('formsList')?.classList.remove('hidden');
    }

    private hideAllSections(): void {
        ['formBuilder', 'formsList', 'formPreview', 'formResponses'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }

    private addField(): void {
        if (!this.currentForm) return;

        const field: FormField = {
            id: crypto.randomUUID(),
            type: 'text',
            label: '',
            required: false
        };

        this.currentForm.fields.push(field);
        this.renderFields();
    }

    private renderFields(): void {
        const fieldsContainer = document.getElementById('formFields');
        if (!fieldsContainer || !this.currentForm) return;

        fieldsContainer.innerHTML = '';
        this.currentForm.fields.forEach((field, index) => {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'form-field';
            fieldElement.innerHTML = `
                <input type="text" value="${field.label}" placeholder="Question" 
                    onchange="formBuilder.updateFieldLabel('${field.id}', this.value)">
                <select onchange="formBuilder.updateFieldType('${field.id}', this.value)">
                    <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                    <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Multiple Choice</option>
                    <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                </select>
                ${this.renderFieldOptions(field)}
                <div class="field-actions">
                    <label>
                        <input type="checkbox" ${field.required ? 'checked' : ''}
                            onchange="formBuilder.toggleRequired('${field.id}', this.checked)">
                        Required
                    </label>
                    <button onclick="formBuilder.deleteField('${field.id}')">Delete</button>
                </div>
            `;
            fieldsContainer.appendChild(fieldElement);
        });
    }

    private renderFieldOptions(field: FormField): string {
        if (field.type !== 'radio' && field.type !== 'checkbox') return '';

        const options = field.options || ['Option 1'];
        return `
            <div class="options-container">
                ${options.map((option, index) => `
                    <input type="text" value="${option}" 
                        onchange="formBuilder.updateOption('${field.id}', ${index}, this.value)">
                `).join('')}
                <button onclick="formBuilder.addOption('${field.id}')">Add Option</button>
            </div>
        `;
    }

    public updateFieldLabel(fieldId: string, label: string): void {
        if (!this.currentForm) return;
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) field.label = label;
    }

    public updateFieldType(fieldId: string, type: 'text' | 'radio' | 'checkbox'): void {
        if (!this.currentForm) return;
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) {
            field.type = type;
            if (type === 'radio' || type === 'checkbox') {
                field.options = ['Option 1'];
            } else {
                delete field.options;
            }
            this.renderFields();
        }
    }

    public toggleRequired(fieldId: string, required: boolean): void {
        if (!this.currentForm) return;
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) field.required = required;
    }

    public deleteField(fieldId: string): void {
        if (!this.currentForm) return;
        this.currentForm.fields = this.currentForm.fields.filter(f => f.id !== fieldId);
        this.renderFields();
    }

    public updateOption(fieldId: string, optionIndex: number, value: string): void {
        if (!this.currentForm) return;
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field && field.options) {
            field.options[optionIndex] = value;
        }
    }

    public addOption(fieldId: string): void {
        if (!this.currentForm) return;
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field && field.options) {
            field.options.push(`Option ${field.options.length + 1}`);
            this.renderFields();
        }
    }

    private saveForm(): void {
        if (!this.currentForm) return;
        const titleInput = document.getElementById('formTitle') as HTMLInputElement;
        this.currentForm.title = titleInput.value || 'Untitled Form';

        const existingFormIndex = this.forms.findIndex(f => f.id === this.currentForm?.id);
        if (existingFormIndex >= 0) {
            this.forms[existingFormIndex] = this.currentForm;
        } else {
            this.forms.push(this.currentForm);
        }

        this.saveToStorage();
        this.showFormsList();
    }

    public previewForm(formId: string): void {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        this.hideAllSections();
        const previewContainer = document.getElementById('previewContainer');
        if (!previewContainer) return;

        previewContainer.innerHTML = `
            <h3>${form.title}</h3>
            ${form.fields.map(field => this.renderPreviewField(field)).join('')}
        `;
        document.getElementById('formPreview')?.classList.remove('hidden');
        document.getElementById('submitFormBtn')?.setAttribute('data-form-id', formId);
    }

    private renderPreviewField(field: FormField): string {
        let fieldHtml = `
            <div class="form-field">
                <label>${field.label}${field.required ? ' *' : ''}</label>
        `;

        switch (field.type) {
            case 'text':
                fieldHtml += `<input type="text" id="${field.id}" ${field.required ? 'required' : ''}>`;
                break;
            case 'radio':
                fieldHtml += (field.options || []).map(option => `
                    <div>
                        <input type="radio" name="${field.id}" value="${option}" ${field.required ? 'required' : ''}>
                        <label>${option}</label>
                    </div>
                `).join('');
                break;
            case 'checkbox':
                fieldHtml += (field.options || []).map(option => `
                    <div>
                        <input type="checkbox" name="${field.id}" value="${option}">
                        <label>${option}</label>
                    </div>
                `).join('');
                break;
        }

        fieldHtml += '</div>';
        return fieldHtml;
    }

    private submitForm(): void {
        const submitBtn = document.getElementById('submitFormBtn');
        const formId = submitBtn?.getAttribute('data-form-id');
        if (!formId) return;

        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        const answers: { [fieldId: string]: string | string[] } = {};
        let isValid = true;

        form.fields.forEach(field => {
            if (field.type === 'text') {
                const input = document.getElementById(field.id) as HTMLInputElement;
                if (field.required && !input.value) {
                    isValid = false;
                    return;
                }
                answers[field.id] = input.value;
            } else {
                const inputs = document.getElementsByName(field.id) as NodeListOf<HTMLInputElement>;
                const selectedValues = Array.from(inputs)
                    .filter(input => input.checked)
                    .map(input => input.value);
                
                if (field.required && selectedValues.length === 0) {
                    isValid = false;
                    return;
                }
                answers[field.id] = selectedValues;
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields');
            return;
        }

        const response: FormResponse = {
            formId,
            timestamp: Date.now(),
            answers
        };

        this.responses.push(response);
        this.saveToStorage();
        alert('Form submitted successfully!');
        this.showFormsList();
    }

    public editForm(formId: string): void {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        this.currentForm = { ...form };
        this.hideAllSections();
        document.getElementById('formBuilder')?.classList.remove('hidden');
        (document.getElementById('formTitle') as HTMLInputElement).value = form.title;
        this.renderFields();
    }

    public deleteForm(formId: string): void {
        if (!confirm('Are you sure you want to delete this form?')) return;
        this.forms = this.forms.filter(f => f.id !== formId);
        this.responses = this.responses.filter(r => r.formId !== formId);
        this.saveToStorage();
        this.showFormsList();
    }

    public viewResponses(formId: string): void {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        this.hideAllSections();
        const responsesContainer = document.getElementById('responsesContainer');
        if (!responsesContainer) return;

        const formResponses = this.responses.filter(r => r.formId === formId);
        responsesContainer.innerHTML = `
            <h3>${form.title} - Responses (${formResponses.length})</h3>
            ${formResponses.map(response => this.renderResponse(form, response)).join('')}
        `;
        document.getElementById('formResponses')?.classList.remove('hidden');
    }

    private renderResponse(form: Form, response: FormResponse): string {
        return `
            <div class="form-card">
                <p>Submitted: ${new Date(response.timestamp).toLocaleString()}</p>
                ${form.fields.map(field => `
                    <div>
                        <strong>${field.label}:</strong>
                        <span>${Array.isArray(response.answers[field.id]) 
                            ? (response.answers[field.id] as string[]).join(', ') 
                            : response.answers[field.id]}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize the form builder
const formBuilder = new FormBuilder();