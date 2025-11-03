import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DealCard from '../Common/DealCard';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';
import dealService from '../../services/dealService';

const KanbanBoard = ({ pipelineId, onDealMove, className = '' }) => {
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPipelineData();
  }, [pipelineId]);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pipeline stages and deals
      const [stagesResponse, dealsResponse] = await Promise.all([
        dealService.getPipelineStages(pipelineId),
        dealService.getPipelineDeals(pipelineId)
      ]);

      setStages(stagesResponse.data);
      setDeals(dealsResponse.data);
    } catch (error) {
      setError('Failed to load pipeline data');
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Find the deal being moved
    const deal = deals.find(d => d.id === draggableId);
    if (!deal) return;

    // Find the destination stage
    const destinationStage = stages.find(s => s.id === destination.droppableId);
    if (!destinationStage) return;

    try {
      // Update deal stage in backend
      await dealService.moveDealStage(deal.id, destinationStage.id);

      // Update local state
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.id === draggableId
            ? { ...d, current_stage_id: destinationStage.id, stage_name: destinationStage.name }
            : d
        )
      );

      // Call parent callback if provided
      if (onDealMove) {
        onDealMove(deal.id, destinationStage.id);
      }
    } catch (error) {
      console.error('Error moving deal:', error);
      // Revert the change in UI
      fetchPipelineData();
    }
  };

  const getDealsForStage = (stageId) => {
    return deals.filter(deal => deal.current_stage_id === stageId);
  };

  const getStageColor = (stage) => {
    const colors = {
      'lead': 'bg-yellow-50 border-yellow-200',
      'qualified': 'bg-blue-50 border-blue-200',
      'proposal': 'bg-purple-50 border-purple-200',
      'negotiation': 'bg-orange-50 border-orange-200',
      'closed won': 'bg-green-50 border-green-200',
      'closed lost': 'bg-red-50 border-red-200'
    };
    return colors[stage.name?.toLowerCase()] || 'bg-gray-50 border-gray-200';
  };

  const getStageValue = (stageId) => {
    const stageDeals = getDealsForStage(stageId);
    return stageDeals.reduce((total, deal) => total + (parseFloat(deal.amount) || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={`kanban-board ${className}`}>
        {stages.map((stage) => {
          const stageDeals = getDealsForStage(stage.id);
          const stageValue = getStageValue(stage.id);

          return (
            <div key={stage.id} className="kanban-column">
              {/* Stage Header */}
              <div className="kanban-column-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-500">
                      {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${stageValue.toLocaleString()}
                    </p>
                    <Badge variant="info" size="xs">
                      {stage.probability}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stage Content */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column-content ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-card ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <DealCard
                              deal={deal}
                              onClick={(deal) => {
                                // Handle deal click
                                window.location.href = `/deals/${deal.id}`;
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {stageDeals.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No deals in this stage
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;