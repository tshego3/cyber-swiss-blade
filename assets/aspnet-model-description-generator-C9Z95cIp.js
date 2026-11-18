var e=`---
title: ModelDescriptionGenerator for ASP.NET Web API Help Pages
summary: A changed ModelDescriptionGenerator for the Web API Help Page area that gives unique names to duplicate model names instead of failing.
category: ASP.NET and Blazor
order: 80
---

# ModelDescriptionGenerator for ASP.NET Web API Help Pages

This code sample is a \`ModelDescriptionGenerator\` class for the Help Page area of an ASP.NET Web API project on .NET Framework 4.x. The Help Page area uses this class to describe the model types of the API. Use this version when two model types have the same model name and the help pages fail.

## Before you start

- An ASP.NET Web API project on .NET Framework 4.x with the Help Page area (\`Areas/HelpPage\`).
- The Help Page model types in \`Areas/HelpPage/ModelDescriptions\`: \`ModelDescription\`, \`ModelNameHelper\`, \`IModelDocumentationProvider\`, and the other description classes.
- The \`Newtonsoft.Json\` package.

## Code

\`\`\`csharp
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;
using System.Web.Http;
using System.Web.Http.Description;
using System.Xml.Serialization;

namespace ContosoWebService.Areas.HelpPage.ModelDescriptions
{
    /// <summary>
    /// Generates model descriptions for given types.
    /// </summary>
    public class ModelDescriptionGenerator
    {
        // Modify this to support more data annotation attributes.
        private readonly IDictionary<Type, Func<object, string>> AnnotationTextGenerator = new Dictionary<Type, Func<object, string>>
        {
            { typeof(RequiredAttribute), a => "Required" },
            { typeof(RangeAttribute), a =>
                {
                    RangeAttribute range = (RangeAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "Range: inclusive between {0} and {1}", range.Minimum, range.Maximum);
                }
            },
            { typeof(MaxLengthAttribute), a =>
                {
                    MaxLengthAttribute maxLength = (MaxLengthAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "Max length: {0}", maxLength.Length);
                }
            },
            { typeof(MinLengthAttribute), a =>
                {
                    MinLengthAttribute minLength = (MinLengthAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "Min length: {0}", minLength.Length);
                }
            },
            { typeof(StringLengthAttribute), a =>
                {
                    StringLengthAttribute strLength = (StringLengthAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "String length: inclusive between {0} and {1}", strLength.MinimumLength, strLength.MaximumLength);
                }
            },
            { typeof(DataTypeAttribute), a =>
                {
                    DataTypeAttribute dataType = (DataTypeAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "Data type: {0}", dataType.CustomDataType ?? dataType.DataType.ToString());
                }
            },
            { typeof(RegularExpressionAttribute), a =>
                {
                    RegularExpressionAttribute regularExpression = (RegularExpressionAttribute)a;
                    return String.Format(CultureInfo.CurrentCulture, "Matching regular expression pattern: {0}", regularExpression.Pattern);
                }
            },
        };

        // Modify this to add more default documentations.
        private readonly IDictionary<Type, string> DefaultTypeDocumentation = new Dictionary<Type, string>
        {
            { typeof(Int16), "integer" },
            { typeof(Int32), "integer" },
            { typeof(Int64), "integer" },
            { typeof(UInt16), "unsigned integer" },
            { typeof(UInt32), "unsigned integer" },
            { typeof(UInt64), "unsigned integer" },
            { typeof(Byte), "byte" },
            { typeof(Char), "character" },
            { typeof(SByte), "signed byte" },
            { typeof(Uri), "URI" },
            { typeof(Single), "decimal number" },
            { typeof(Double), "decimal number" },
            { typeof(Decimal), "decimal number" },
            { typeof(String), "string" },
            { typeof(Guid), "globally unique identifier" },
            { typeof(TimeSpan), "time interval" },
            { typeof(DateTime), "date" },
            { typeof(DateTimeOffset), "date" },
            { typeof(Boolean), "boolean" },
        };

        private Lazy<IModelDocumentationProvider> _documentationProvider;

        public ModelDescriptionGenerator(HttpConfiguration config)
        {
            if (config == null)
            {
                throw new ArgumentNullException("config");
            }

            _documentationProvider = new Lazy<IModelDocumentationProvider>(() => config.Services.GetDocumentationProvider() as IModelDocumentationProvider);
            GeneratedModels = new Dictionary<string, ModelDescription>(StringComparer.OrdinalIgnoreCase);
        }

        public Dictionary<string, ModelDescription> GeneratedModels { get; private set; }

        private IModelDocumentationProvider DocumentationProvider
        {
            get
            {
                return _documentationProvider.Value;
            }
        }

        public ModelDescription GetOrCreateModelDescription(Type modelType)
        {
            if (modelType == null)
            {
                throw new ArgumentNullException("modelType");
            }

            Type underlyingType = Nullable.GetUnderlyingType(modelType);
            if (underlyingType != null)
            {
                modelType = underlyingType;
            }

            ModelDescription modelDescription;

            string modelName = ModelNameHelper.GetModelName(modelType);

            if (GeneratedModels.TryGetValue(modelName, out modelDescription))
            {
                if (modelType != modelDescription.ModelType)
                {
                    var keys = new List<KeyValuePair<string, ModelDescription>>();
                    foreach (var pair in GeneratedModels)
                    {
                        if (pair.Value.ModelType.FullName.Equals(modelType.FullName))
                        {
                            keys.Add(pair);
                        }
                    }

                    var key = keys.FirstOrDefault();
                    if (keys != null && keys.Count > 0 && key.Value.ModelType.FullName.Equals(modelType.FullName))
                    {
                        return key.Value;
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine(
                        String.Format(
                            CultureInfo.CurrentCulture,
                            "A model description could not be created. Duplicate model name '{0}' was found for types '{1}' and '{2}'. " +
                            "Use the [ModelName] attribute to change the model name for at least one of the types so that it has a unique name.",
                            modelName,
                            modelDescription.ModelType.FullName,
                            modelType.FullName));
                    }
                }
                else
                {
                    return modelDescription;
                }
            }

            if (DefaultTypeDocumentation.ContainsKey(modelType))
            {
                return GenerateSimpleTypeModelDescription(modelType);
            }

            if (modelType.IsEnum)
            {
                return GenerateEnumTypeModelDescription(modelType);
            }

            if (modelType.IsGenericType)
            {
                Type[] genericArguments = modelType.GetGenericArguments();

                if (genericArguments.Length == 1)
                {
                    Type enumerableType = typeof(IEnumerable<>).MakeGenericType(genericArguments);
                    if (enumerableType.IsAssignableFrom(modelType))
                    {
                        return GenerateCollectionModelDescription(modelType, genericArguments[0]);
                    }
                }
                if (genericArguments.Length == 2)
                {
                    Type dictionaryType = typeof(IDictionary<,>).MakeGenericType(genericArguments);
                    if (dictionaryType.IsAssignableFrom(modelType))
                    {
                        return GenerateDictionaryModelDescription(modelType, genericArguments[0], genericArguments[1]);
                    }

                    Type keyValuePairType = typeof(KeyValuePair<,>).MakeGenericType(genericArguments);
                    if (keyValuePairType.IsAssignableFrom(modelType))
                    {
                        return GenerateKeyValuePairModelDescription(modelType, genericArguments[0], genericArguments[1]);
                    }
                }
            }

            if (modelType.IsArray)
            {
                Type elementType = modelType.GetElementType();
                return GenerateCollectionModelDescription(modelType, elementType);
            }

            if (modelType == typeof(NameValueCollection))
            {
                return GenerateDictionaryModelDescription(modelType, typeof(string), typeof(string));
            }

            if (typeof(IDictionary).IsAssignableFrom(modelType))
            {
                return GenerateDictionaryModelDescription(modelType, typeof(object), typeof(object));
            }

            if (typeof(IEnumerable).IsAssignableFrom(modelType))
            {
                return GenerateCollectionModelDescription(modelType, typeof(object));
            }

            return GenerateComplexTypeModelDescription(modelType);
        }

        // Change this to provide different name for the member.
        private static string GetMemberName(MemberInfo member, bool hasDataContractAttribute)
        {
            JsonPropertyAttribute jsonProperty = member.GetCustomAttribute<JsonPropertyAttribute>();
            if (jsonProperty != null && !String.IsNullOrEmpty(jsonProperty.PropertyName))
            {
                return jsonProperty.PropertyName;
            }

            if (hasDataContractAttribute)
            {
                DataMemberAttribute dataMember = member.GetCustomAttribute<DataMemberAttribute>();
                if (dataMember != null && !String.IsNullOrEmpty(dataMember.Name))
                {
                    return dataMember.Name;
                }
            }

            return member.Name;
        }

        private static bool ShouldDisplayMember(MemberInfo member, bool hasDataContractAttribute)
        {
            JsonIgnoreAttribute jsonIgnore = member.GetCustomAttribute<JsonIgnoreAttribute>();
            XmlIgnoreAttribute xmlIgnore = member.GetCustomAttribute<XmlIgnoreAttribute>();
            IgnoreDataMemberAttribute ignoreDataMember = member.GetCustomAttribute<IgnoreDataMemberAttribute>();
            NonSerializedAttribute nonSerialized = member.GetCustomAttribute<NonSerializedAttribute>();
            ApiExplorerSettingsAttribute apiExplorerSetting = member.GetCustomAttribute<ApiExplorerSettingsAttribute>();

            bool hasMemberAttribute = member.DeclaringType.IsEnum ?
                member.GetCustomAttribute<EnumMemberAttribute>() != null :
                member.GetCustomAttribute<DataMemberAttribute>() != null;

            // Display member only if all the followings are true:
            // no JsonIgnoreAttribute
            // no XmlIgnoreAttribute
            // no IgnoreDataMemberAttribute
            // no NonSerializedAttribute
            // no ApiExplorerSettingsAttribute with IgnoreApi set to true
            // no DataContractAttribute without DataMemberAttribute or EnumMemberAttribute
            return jsonIgnore == null &&
                xmlIgnore == null &&
                ignoreDataMember == null &&
                nonSerialized == null &&
                (apiExplorerSetting == null || !apiExplorerSetting.IgnoreApi) &&
                (!hasDataContractAttribute || hasMemberAttribute);
        }

        private string CreateDefaultDocumentation(Type type)
        {
            string documentation;
            if (DefaultTypeDocumentation.TryGetValue(type, out documentation))
            {
                return documentation;
            }
            if (DocumentationProvider != null)
            {
                documentation = DocumentationProvider.GetDocumentation(type);
            }

            return documentation;
        }

        private void GenerateAnnotations(MemberInfo property, ParameterDescription propertyModel)
        {
            List<ParameterAnnotation> annotations = new List<ParameterAnnotation>();

            IEnumerable<Attribute> attributes = property.GetCustomAttributes();
            foreach (Attribute attribute in attributes)
            {
                Func<object, string> textGenerator;
                if (AnnotationTextGenerator.TryGetValue(attribute.GetType(), out textGenerator))
                {
                    annotations.Add(
                        new ParameterAnnotation
                        {
                            AnnotationAttribute = attribute,
                            Documentation = textGenerator(attribute)
                        });
                }
            }

            // Rearrange the annotations
            annotations.Sort((x, y) =>
            {
                // Special-case RequiredAttribute so that it shows up on top
                if (x.AnnotationAttribute is RequiredAttribute)
                {
                    return -1;
                }
                if (y.AnnotationAttribute is RequiredAttribute)
                {
                    return 1;
                }

                // Sort the rest based on alphabetic order of the documentation
                return String.Compare(x.Documentation, y.Documentation, StringComparison.OrdinalIgnoreCase);
            });

            foreach (ParameterAnnotation annotation in annotations)
            {
                propertyModel.Annotations.Add(annotation);
            }
        }

        private CollectionModelDescription GenerateCollectionModelDescription(Type modelType, Type elementType)
        {
            ModelDescription collectionModelDescription = GetOrCreateModelDescription(elementType);
            if (collectionModelDescription != null)
            {
                return new CollectionModelDescription
                {
                    Name = ModelNameHelper.GetModelName(modelType),
                    ModelType = modelType,
                    ElementDescription = collectionModelDescription
                };
            }

            return null;
        }

        private ModelDescription GenerateComplexTypeModelDescription(Type modelType)
        {
            ComplexTypeModelDescription complexModelDescription = new ComplexTypeModelDescription
            {
                Name = ModelNameHelper.GetModelName(modelType),
                ModelType = modelType,
                Documentation = CreateDefaultDocumentation(modelType)
            };

            if (GeneratedModels.ContainsKey(complexModelDescription.Name).Equals(true))
            {
                GeneratedModels.Add(CombineClassAndPropertyIntoModelTypeName(complexModelDescription.Name), complexModelDescription);
            }
            else
            {
                GeneratedModels.Add(complexModelDescription.Name, complexModelDescription);
            }

            bool hasDataContractAttribute = modelType.GetCustomAttribute<DataContractAttribute>() != null;
            PropertyInfo[] properties = modelType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            foreach (PropertyInfo property in properties)
            {
                if (ShouldDisplayMember(property, hasDataContractAttribute))
                {
                    ParameterDescription propertyModel = new ParameterDescription
                    {
                        Name = GetMemberName(property, hasDataContractAttribute)
                    };

                    if (DocumentationProvider != null)
                    {
                        propertyModel.Documentation = DocumentationProvider.GetDocumentation(property);
                    }

                    GenerateAnnotations(property, propertyModel);
                    complexModelDescription.Properties.Add(propertyModel);
                    propertyModel.TypeDescription = GetOrCreateModelDescription(property.PropertyType);
                }
            }

            FieldInfo[] fields = modelType.GetFields(BindingFlags.Public | BindingFlags.Instance);
            foreach (FieldInfo field in fields)
            {
                if (ShouldDisplayMember(field, hasDataContractAttribute))
                {
                    ParameterDescription propertyModel = new ParameterDescription
                    {
                        Name = GetMemberName(field, hasDataContractAttribute)
                    };

                    if (DocumentationProvider != null)
                    {
                        propertyModel.Documentation = DocumentationProvider.GetDocumentation(field);
                    }

                    complexModelDescription.Properties.Add(propertyModel);
                    propertyModel.TypeDescription = GetOrCreateModelDescription(field.FieldType);
                }
            }

            return complexModelDescription;
        }

        private DictionaryModelDescription GenerateDictionaryModelDescription(Type modelType, Type keyType, Type valueType)
        {
            ModelDescription keyModelDescription = GetOrCreateModelDescription(keyType);
            ModelDescription valueModelDescription = GetOrCreateModelDescription(valueType);

            return new DictionaryModelDescription
            {
                Name = ModelNameHelper.GetModelName(modelType),
                ModelType = modelType,
                KeyModelDescription = keyModelDescription,
                ValueModelDescription = valueModelDescription
            };
        }

        private EnumTypeModelDescription GenerateEnumTypeModelDescription(Type modelType)
        {
            EnumTypeModelDescription enumDescription = new EnumTypeModelDescription
            {
                Name = ModelNameHelper.GetModelName(modelType),
                ModelType = modelType,
                Documentation = CreateDefaultDocumentation(modelType)
            };
            bool hasDataContractAttribute = modelType.GetCustomAttribute<DataContractAttribute>() != null;
            foreach (FieldInfo field in modelType.GetFields(BindingFlags.Public | BindingFlags.Static))
            {
                if (ShouldDisplayMember(field, hasDataContractAttribute))
                {
                    EnumValueDescription enumValue = new EnumValueDescription
                    {
                        Name = field.Name,
                        Value = field.GetRawConstantValue().ToString()
                    };
                    if (DocumentationProvider != null)
                    {
                        enumValue.Documentation = DocumentationProvider.GetDocumentation(field);
                    }
                    enumDescription.Values.Add(enumValue);
                }
            }

            if (GeneratedModels.ContainsKey(enumDescription.Name).Equals(true))
            {
                GeneratedModels.Add(CombineClassAndPropertyIntoModelTypeName(enumDescription.Name), enumDescription);
            }
            else
            {
                GeneratedModels.Add(enumDescription.Name, enumDescription);
            }

            return enumDescription;
        }

        private KeyValuePairModelDescription GenerateKeyValuePairModelDescription(Type modelType, Type keyType, Type valueType)
        {
            ModelDescription keyModelDescription = GetOrCreateModelDescription(keyType);
            ModelDescription valueModelDescription = GetOrCreateModelDescription(valueType);

            return new KeyValuePairModelDescription
            {
                Name = ModelNameHelper.GetModelName(modelType),
                ModelType = modelType,
                KeyModelDescription = keyModelDescription,
                ValueModelDescription = valueModelDescription
            };
        }

        private ModelDescription GenerateSimpleTypeModelDescription(Type modelType)
        {
            SimpleTypeModelDescription simpleModelDescription = new SimpleTypeModelDescription
            {
                Name = ModelNameHelper.GetModelName(modelType),
                ModelType = modelType,
                Documentation = CreateDefaultDocumentation(modelType)
            };

            if (GeneratedModels.ContainsKey(simpleModelDescription.Name).Equals(true))
            {
                GeneratedModels.Add(CombineClassAndPropertyIntoModelTypeName(simpleModelDescription.Name), simpleModelDescription);
            }
            else
            {
                GeneratedModels.Add(simpleModelDescription.Name, simpleModelDescription);
            }

            return simpleModelDescription;
        }

        private string CombineModelTypeNameWithNum(string[] parts)
        {
            int incrementedNumber = int.Parse(Regex.Match(parts[parts.Length - 1], @"\\d+$").Value) + 1;
            return string.Concat((parts[parts.Length - 1]).Substring(0, (parts[parts.Length - 1]).Length - Convert.ToString(int.Parse(Regex.Match(parts[parts.Length - 1], @"\\d+$").Value)).Length)
                , Convert.ToString(incrementedNumber));
        }

        private string CombineClassAndPropertyIntoModelTypeName(string input, bool isReRun = false)
        {
            string[] parts = input.Split('.');

            if (parts.Length == 1)
            {
                if (Regex.IsMatch(parts[parts.Length - 1], @"\\d+$"))
                {
                    input = CombineModelTypeNameWithNum(parts);
                }
                else
                {
                    var keys = new List<string>();
                    foreach (var pair in GeneratedModels)
                    {
                        if (pair.Value.ModelType.Name.Equals(input))
                        {
                            keys.Add(pair.Key);
                        }
                    }

                    input = string.Concat(parts[parts.Length - 1], Convert.ToString(keys.Count > 0 ? keys.Count + 1 : 1));
                }

                return input;
            }

            string beforeLastDot = parts[parts.Length - 2];
            string afterLastDot = parts[parts.Length - 1];
            return string.Concat(beforeLastDot, "_", afterLastDot);
        }
    }
}
\`\`\`

## How to use it

1. Open \`Areas/HelpPage/ModelDescriptions/ModelDescriptionGenerator.cs\` in your project.
2. Replace the contents with the code.
3. Change the namespace \`ContosoWebService.Areas.HelpPage.ModelDescriptions\` to the namespace of your project.
4. Build the project and open the help pages.

The Help Page area creates the generator with the \`HttpConfiguration\` of the app and calls \`GetOrCreateModelDescription\` for each type:

\`\`\`csharp
var generator = new ModelDescriptionGenerator(config);
ModelDescription description = generator.GetOrCreateModelDescription(typeof(User));
\`\`\`

## How it works

### Supported types and annotations

- \`AnnotationTextGenerator\` gives the help text for these data annotation attributes: \`Required\`, \`Range\`, \`MaxLength\`, \`MinLength\`, \`StringLength\`, \`DataType\`, and \`RegularExpression\`. Add entries to support more attributes.
- \`GenerateAnnotations\` puts \`Required\` first. It sorts the other annotations by their text, in alphabetical order.
- \`DefaultTypeDocumentation\` gives the default text for simple types, for example "integer" for \`Int32\` and "date" for \`DateTime\`. Add entries to change the default text.
- \`GetOrCreateModelDescription\` uses the underlying type of a nullable type. It then makes a simple, enum, collection, dictionary, key-value pair, or complex type description.

### Hidden members

A property or field shows in the help pages only if all these conditions are true:

- It has no \`JsonIgnore\`, \`XmlIgnore\`, \`IgnoreDataMember\`, or \`NonSerialized\` attribute.
- It has no \`ApiExplorerSettings\` attribute with \`IgnoreApi\` set to \`true\`.
- If the type has a \`DataContract\` attribute, the member has a \`DataMember\` attribute (or an \`EnumMember\` attribute for an enum value).

The member name comes from \`JsonProperty.PropertyName\`, then from \`DataMember.Name\` (only on a \`DataContract\` type), then from the member name.

### Duplicate model names

The standard Help Page generator stops with an error when two types have the same model name. This version does not stop:

1. If the model name already exists for a different type, the generator looks for a stored model with the same full type name. If it finds one, it returns that model.
2. If it does not find one, it writes a message to the debug output and continues.
3. Before it stores a complex, enum, or simple type description, it checks if the name already exists. If it exists, \`CombineClassAndPropertyIntoModelTypeName\` makes a new name:
   - A name with dots (\`A.B\`) becomes \`A_B\`.
   - A name that ends in a number gets the next number (\`Address2\` becomes \`Address3\`).
   - Other names get a number: the count of stored models with the same type name plus 1, or 1 if there are none.

> **NOTE:** The generator does not check if the new name also exists. If it exists, \`Dictionary.Add\` throws an \`ArgumentException\`. The \`isReRun\` parameter of \`CombineClassAndPropertyIntoModelTypeName\` is not used.

## Related links

- [Create API documentation for ASP.NET Web API in .NET Framework 4.x](doc:aspnet-web-api-help-pages)
`;export{e as default};