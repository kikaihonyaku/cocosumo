module UniqueIdGeneration
  extend ActiveSupport::Concern

  class_methods do
    # Wraps save/create with retry logic for unique ID collisions.
    # Usage: include UniqueIdGeneration
    #        retry_on_unique_violation :publication_id  (or :public_id, etc.)
    def retry_on_unique_violation(*columns)
      define_method(:_unique_id_columns) { columns }

      # Override save to add retry on unique violation
      define_method(:save) do |**options, &block|
        retries = 0
        begin
          super(**options, &block)
        rescue ActiveRecord::RecordNotUnique => e
          retries += 1
          if retries <= 3 && _unique_id_columns.any? { |col| e.message.include?(col.to_s) }
            _unique_id_columns.each { |col| send(:"generate_#{col}") if respond_to?(:"generate_#{col}", true) }
            retry
          end
          raise
        end
      end

      define_method(:save!) do |**options, &block|
        retries = 0
        begin
          super(**options, &block)
        rescue ActiveRecord::RecordNotUnique => e
          retries += 1
          if retries <= 3 && _unique_id_columns.any? { |col| e.message.include?(col.to_s) }
            _unique_id_columns.each { |col| send(:"generate_#{col}") if respond_to?(:"generate_#{col}", true) }
            retry
          end
          raise
        end
      end
    end
  end
end
