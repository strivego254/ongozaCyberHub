# Schema Synchronization Logic Pseudocode

## Overview

This document describes the logic for keeping schemas synchronized between Django (DRF serializers) and FastAPI (Pydantic models).

## Manual Synchronization Process

```
FUNCTION sync_schemas():
    // Step 1: Read shared schema definitions
    shared_schemas = read_shared_schemas("/shared/schemas/base_schemas.md")
    
    // Step 2: Update Django serializers
    django_schemas = generate_django_serializers(shared_schemas)
    write_django_serializers(django_schemas)
    
    // Step 3: Update FastAPI Pydantic models
    fastapi_schemas = generate_fastapi_models(shared_schemas)
    write_fastapi_models(fastapi_schemas)
    
    // Step 4: Regenerate OpenAPI schemas
    regenerate_openapi_django()
    regenerate_openapi_fastapi()
    
    // Step 5: Validate consistency
    validate_schema_consistency()
END FUNCTION
```

## Schema Comparison

```
FUNCTION compare_schemas(django_schema, fastapi_schema):
    differences = []
    
    // Compare fields
    django_fields = extract_fields(django_schema)
    fastapi_fields = extract_fields(fastapi_schema)
    
    FOR EACH field IN django_fields:
        IF field NOT IN fastapi_fields:
            differences.append({
                type: "missing_field",
                service: "fastapi",
                field: field
            })
    
    FOR EACH field IN fastapi_fields:
        IF field NOT IN django_fields:
            differences.append({
                type: "missing_field",
                service: "django",
                field: field
            })
    
    // Compare field types
    FOR EACH field IN django_fields:
        IF field IN fastapi_fields:
            django_type = get_field_type(django_schema, field)
            fastapi_type = get_field_type(fastapi_schema, field)
            
            IF NOT types_compatible(django_type, fastapi_type):
                differences.append({
                    type: "type_mismatch",
                    field: field,
                    django_type: django_type,
                    fastapi_type: fastapi_type
                })
    
    RETURN differences
END FUNCTION
```

## Type Compatibility Check

```
FUNCTION types_compatible(django_type, fastapi_type):
    type_mapping = {
        "CharField": "str",
        "EmailField": "EmailStr",
        "IntegerField": "int",
        "FloatField": "float",
        "BooleanField": "bool",
        "DateTimeField": "datetime",
        "TextField": "str",
        "URLField": "str",
        "JSONField": "dict"
    }
    
    mapped_django_type = type_mapping.get(django_type, django_type)
    
    IF mapped_django_type == fastapi_type:
        RETURN True
    
    // Check for nullable types
    IF fastapi_type.startswith("Optional[") AND mapped_django_type == fastapi_type[9:-1]:
        RETURN True
    
    RETURN False
END FUNCTION
```

## Automated Sync Tool (Future Implementation)

```
FUNCTION automated_sync():
    // Monitor schema files for changes
    WHILE True:
        django_changes = detect_changes("/backend/django_app/shared_schemas/")
        fastapi_changes = detect_changes("/backend/fastapi_app/schemas/")
        
        IF django_changes OR fastapi_changes:
            // Extract schema definitions
            django_schemas = parse_django_serializers()
            fastapi_schemas = parse_fastapi_models()
            
            // Compare and identify differences
            differences = compare_schemas(django_schemas, fastapi_schemas)
            
            IF len(differences) > 0:
                // Generate sync report
                report = generate_sync_report(differences)
                
                // Optionally auto-fix compatible differences
                IF auto_fix_enabled:
                    apply_fixes(differences)
                ELSE:
                    notify_developers(report)
        
        SLEEP(60)  // Check every minute
END FUNCTION
```

## Schema Validation

```
FUNCTION validate_schema_consistency():
    errors = []
    
    // Load all schemas
    django_schemas = load_django_schemas()
    fastapi_schemas = load_fastapi_schemas()
    shared_schemas = load_shared_schemas()
    
    // Validate Django against shared
    FOR EACH schema IN shared_schemas:
        django_schema = django_schemas.get(schema.name)
        IF django_schema IS NULL:
            errors.append(f"Missing Django schema: {schema.name}")
        ELSE:
            schema_errors = validate_schema_match(schema, django_schema)
            errors.extend(schema_errors)
    
    // Validate FastAPI against shared
    FOR EACH schema IN shared_schemas:
        fastapi_schema = fastapi_schemas.get(schema.name)
        IF fastapi_schema IS NULL:
            errors.append(f"Missing FastAPI schema: {schema.name}")
        ELSE:
            schema_errors = validate_schema_match(schema, fastapi_schema)
            errors.extend(schema_errors)
    
    // Validate Django against FastAPI
    FOR EACH django_schema IN django_schemas:
        fastapi_schema = fastapi_schemas.get(django_schema.name)
        IF fastapi_schema IS NULL:
            errors.append(f"Missing FastAPI schema for: {django_schema.name}")
        ELSE:
            differences = compare_schemas(django_schema, fastapi_schema)
            IF len(differences) > 0:
                errors.append(f"Schema mismatch: {django_schema.name}")
    
    RETURN errors
END FUNCTION
```

## OpenAPI Schema Generation

```
FUNCTION regenerate_openapi_django():
    // Run Django management command
    EXECUTE("python manage.py spectacular --file shared/openapi/openapi_django.json")
    
    // Validate generated schema
    schema = load_json("shared/openapi/openapi_django.json")
    validate_openapi_schema(schema)
END FUNCTION

FUNCTION regenerate_openapi_fastapi():
    // Fetch from FastAPI endpoint
    response = HTTP_GET("http://localhost:8001/openapi.json")
    schema = response.json()
    
    // Save to shared location
    write_json("shared/openapi/openapi_fastapi.json", schema)
    
    // Validate generated schema
    validate_openapi_schema(schema)
END FUNCTION
```

## Schema Migration Process

```
FUNCTION migrate_schema(schema_name, new_version):
    // Step 1: Create backup
    backup_django_schemas()
    backup_fastapi_schemas()
    
    // Step 2: Update shared schema definition
    update_shared_schema(schema_name, new_version)
    
    // Step 3: Update Django serializer
    update_django_serializer(schema_name, new_version)
    
    // Step 4: Update FastAPI Pydantic model
    update_fastapi_model(schema_name, new_version)
    
    // Step 5: Run tests
    run_django_tests()
    run_fastapi_tests()
    
    // Step 6: Regenerate OpenAPI schemas
    regenerate_openapi_django()
    regenerate_openapi_fastapi()
    
    // Step 7: Update API documentation
    update_api_documentation(schema_name)
    
    // Step 8: Notify team
    notify_schema_change(schema_name, new_version)
END FUNCTION
```

## Version Control Integration

```
FUNCTION pre_commit_hook():
    // Validate schema consistency before commit
    errors = validate_schema_consistency()
    
    IF len(errors) > 0:
        PRINT("Schema validation errors:")
        FOR EACH error IN errors:
            PRINT(f"  - {error}")
        EXIT(1)  // Block commit
    
    // Regenerate OpenAPI schemas
    regenerate_openapi_django()
    regenerate_openapi_fastapi()
    
    // Add generated files to commit
    git_add("shared/openapi/")
END FUNCTION
```

## CI/CD Integration

```
FUNCTION ci_schema_validation():
    // Run in CI pipeline
    errors = validate_schema_consistency()
    
    IF len(errors) > 0:
        FAIL_BUILD("Schema consistency validation failed")
    
    // Generate OpenAPI schemas
    regenerate_openapi_django()
    regenerate_openapi_fastapi()
    
    // Compare with committed versions
    committed_django = load_json("shared/openapi/openapi_django.json")
    committed_fastapi = load_json("shared/openapi/openapi_fastapi.json")
    
    IF generated_django != committed_django:
        FAIL_BUILD("Django OpenAPI schema out of sync")
    
    IF generated_fastapi != committed_fastapi:
        FAIL_BUILD("FastAPI OpenAPI schema out of sync")
END FUNCTION
```

## Implementation Notes

- Use AST parsing for schema extraction
- Implement schema diff visualization
- Create CLI tool for manual sync operations
- Add schema versioning support
- Implement rollback mechanism for schema changes
- Add monitoring and alerting for schema drift


