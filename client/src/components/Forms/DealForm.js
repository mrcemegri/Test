import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import dealService from '../../services/dealService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const dealSchema = yup.object().shape({
  name: yup.string().required('Deal name is required').min(2, 'Deal name must be at least 2 characters'),
  amount: yup.number().positive('Amount must be positive').optional(),
  currency: yup.string().default('USD'),
  pipeline_id: yup.string().required('Pipeline is required'),
  current_stage_id: yup.string().required('Stage is required'),
  contact_id: yup.string().required('Contact is required'),
  company_id: yup.string().optional(),
  assigned_to: yup.string().optional(),
  expected_close_date: yup.date().optional(),
  description: yup.string().optional()
});

const DealForm = ({ isOpen, onClose, deal, onSuccess, pipelines = [], contacts = [], companies = [], users = [] }) => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [stages, setStages] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(dealSchema),
    defaultValues: {
      name: '',
      amount: '',
      currency: 'USD',
      pipeline_id: '',
      current_stage_id: '',
      contact_id: '',
      company_id: '',
      assigned_to: '',
      expected_close_date: '',
      description: ''
    }
  });

  const selectedPipelineId = watch('pipeline_id');

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      // Set default pipeline
      const defaultPipeline = pipelines.find(p => p.is_active) || pipelines[0];
      if (defaultPipeline) {
        setValue('pipeline_id', defaultPipeline.id);
        setSelectedPipeline(defaultPipeline);
        setStages(defaultPipeline.stages || []);

        // Set default stage
        if (defaultPipeline.stages && defaultPipeline.stages.length > 0) {
          const firstStage = defaultPipeline.stages.sort((a, b) => a.order_index - b.order_index)[0];
          if (firstStage) {
            setValue('current_stage_id', firstStage.id);
          }
        }
      }
    }
  }, [pipelines, setValue, selectedPipelineId]);

  useEffect(() => {
    if (selectedPipelineId) {
      const pipeline = pipelines.find(p => p.id === selectedPipelineId);
      setSelectedPipeline(pipeline);
      setStages(pipeline?.stages || []);

      // Set default stage when pipeline changes
      if (pipeline?.stages && pipeline.stages.length > 0) {
        const firstStage = pipeline.stages.sort((a, b) => a.order_index - b.order_index)[0];
        if (firstStage) {
          setValue('current_stage_id', firstStage.id);
        }
      }
    }
  }, [selectedPipelineId, pipelines, setValue]);

  useEffect(() => {
    if (deal) {
      // Edit mode - populate form with deal data
      reset({
        name: deal.name || '',
        amount: deal.amount || '',
        currency: deal.currency || 'USD',
        pipeline_id: deal.pipeline_id || '',
        current_stage_id: deal.current_stage_id || '',
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
        assigned_to: deal.assigned_to || '',
        expected_close_date: deal.expected_close_date?.split('T')[0] || '',
        description: deal.description || ''
      });

      // Set pipeline and stages for edit mode
      const pipeline = pipelines.find(p => p.id === deal.pipeline_id);
      setSelectedPipeline(pipeline);
      setStages(pipeline?.stages || []);
    } else {
      // Create mode - reset form
      reset({
        name: '',
        amount: '',
        currency: 'USD',
        pipeline_id: selectedPipelineId || '',
        current_stage_id: '',
        contact_id: '',
        company_id: '',
        assigned_to: hasRole(['admin', 'manager']) ? '' : user.id,
        expected_close_date: '',
        description: ''
      });
    }
  }, [deal, reset, selectedPipelineId, pipelines, user, hasRole]);

  const handleContactChange = (contactId) => {
    // Auto-fill company when contact is selected
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.company_id) {
      setValue('company_id', contact.company_id);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Format the data
      const formattedData = {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : null,
        expected_close_date: data.expected_close_date ? new Date(data.expected_close_date).toISOString() : null
      };

      let response;
      if (deal) {
        // Update existing deal
        response = await dealService.updateDeal(deal.id, formattedData);
        toast.success('Deal updated successfully');
      } else {
        // Create new deal
        response = await dealService.createDeal(formattedData);
        toast.success('Deal created successfully');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
      reset();
    } catch (error) {
      console.error('Error saving deal:', error);
      // Error is handled by the API interceptor
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deal ? 'Edit Deal' : 'Create New Deal'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="name"
          label="Deal Name"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="amount"
            label="Deal Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              {...register('currency')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pipeline_id" className="block text-sm font-medium text-gray-700 mb-1">
              Pipeline
            </label>
            <select
              id="pipeline_id"
              {...register('pipeline_id')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a pipeline</option>
              {pipelines.filter(p => p.is_active).map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="current_stage_id" className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              id="current_stage_id"
              {...register('current_stage_id')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a stage</option>
              {stages
                .sort((a, b) => a.order_index - b.order_index)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({stage.probability}% probability)
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 mb-1">
              Contact *
            </label>
            <select
              id="contact_id"
              {...register('contact_id', { onChange: (e) => handleContactChange(e.target.value) })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} ({contact.email})
                </option>
              ))}
            </select>
          </div>

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

        <Input
          id="expected_close_date"
          label="Expected Close Date"
          type="date"
          error={errors.expected_close_date?.message}
          {...register('expected_close_date')}
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Add any additional details about this deal..."
          />
        </div>

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
            {deal ? 'Update Deal' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DealForm;