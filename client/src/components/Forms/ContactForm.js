import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import contactService from '../../services/contactService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const contactSchema = yup.object().shape({
  first_name: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  last_name: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Invalid email address'),
  phone: yup.string().optional(),
  mobile: yup.string().optional(),
  company_id: yup.string().optional(),
  job_title: yup.string().optional(),
  department: yup.string().optional(),
  assigned_to: yup.string().optional(),
  lifecycle_stage: yup.string().oneOf(['lead', 'mql', 'sql', 'opportunity', 'customer'], 'Invalid lifecycle stage').default('lead')
});

const ContactForm = ({ isOpen, onClose, contact, onSuccess, companies = [], users = [] }) => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile: '',
      company_id: '',
      job_title: '',
      department: '',
      assigned_to: '',
      lifecycle_stage: 'lead'
    }
  });

  useEffect(() => {
    if (contact) {
      // Edit mode - populate form with contact data
      reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        company_id: contact.company_id || '',
        job_title: contact.job_title || '',
        department: contact.department || '',
        assigned_to: contact.assigned_to || '',
        lifecycle_stage: contact.lifecycle_stage || 'lead'
      });
    } else {
      // Create mode - reset form
      reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        company_id: '',
        job_title: '',
        department: '',
        assigned_to: hasRole(['admin', 'manager']) ? '' : user.id,
        lifecycle_stage: 'lead'
      });
    }
  }, [contact, reset, user, hasRole]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      let response;
      if (contact) {
        // Update existing contact
        response = await contactService.updateContact(contact.id, data);
        toast.success('Contact updated successfully');
      } else {
        // Create new contact
        response = await contactService.createContact(data);
        toast.success('Contact created successfully');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
      reset();
    } catch (error) {
      console.error('Error saving contact:', error);
      // Error is handled by the API interceptor
    } finally {
      setLoading(false);
    }
  };

  const lifecycleStageOptions = [
    { value: 'lead', label: 'Lead' },
    { value: 'mql', label: 'Marketing Qualified Lead' },
    { value: 'sql', label: 'Sales Qualified Lead' },
    { value: 'opportunity', label: 'Opportunity' },
    { value: 'customer', label: 'Customer' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Create New Contact'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="first_name"
            label="First Name"
            required
            error={errors.first_name?.message}
            {...register('first_name')}
          />

          <Input
            id="last_name"
            label="Last Name"
            required
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          id="email"
          label="Email Address"
          type="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="phone"
            label="Phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            id="mobile"
            label="Mobile"
            type="tel"
            error={errors.mobile?.message}
            {...register('mobile')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="company_id"
              {...register('company_id')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="job_title"
            label="Job Title"
            error={errors.job_title?.message}
            {...register('job_title')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="department"
            label="Department"
            error={errors.department?.message}
            {...register('department')}
          />

          <div>
            <label htmlFor="lifecycle_stage" className="block text-sm font-medium text-gray-700 mb-1">
              Lifecycle Stage
            </label>
            <select
              id="lifecycle_stage"
              {...register('lifecycle_stage')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {lifecycleStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned To - Only show for admin/manager */}
        {hasRole(['admin', 'manager']) && (
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              id="assigned_to"
              {...register('assigned_to')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
          >
            {contact ? 'Update Contact' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactForm;