"""Minimal JSON Schema (draft 2020-12) validator, standard library only.

Supports the keywords used by schemas/course.schema.json: type, enum, const,
required, properties, additionalProperties (false), items, minItems, maxItems,
minLength, maxLength, pattern, minimum, maximum, $ref (local), allOf, if/then.
"""

import re

_TYPES = {
    "object": dict,
    "array": list,
    "string": str,
    "boolean": bool,
    "null": type(None),
}


def _is_type(value, name):
    if name == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if name == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(value, _TYPES[name])


def _pointer(path):
    return "/" + "/".join(str(p) for p in path) if path else "/"


class Validator:
    def __init__(self, schema):
        self.root = schema

    def _resolve(self, ref):
        if not ref.startswith("#/"):
            raise ValueError(f"only local $ref supported: {ref}")
        node = self.root
        for part in ref[2:].split("/"):
            node = node[part]
        return node

    def errors(self, instance):
        out = []
        self._validate(instance, self.root, [], out)
        return out

    def _validate(self, value, schema, path, out):
        if schema is True or schema == {}:
            return
        if "$ref" in schema:
            self._validate(value, self._resolve(schema["$ref"]), path, out)

        t = schema.get("type")
        if t is not None:
            types = t if isinstance(t, list) else [t]
            if not any(_is_type(value, x) for x in types):
                out.append((_pointer(path), f"expected {' or '.join(types)}, got {type(value).__name__}"))
                return

        if "enum" in schema and value not in schema["enum"]:
            out.append((_pointer(path), f"{value!r} is not one of {schema['enum']}"))
        if "const" in schema and value != schema["const"]:
            out.append((_pointer(path), f"{value!r} must be {schema['const']!r}"))

        if isinstance(value, str):
            if "minLength" in schema and len(value) < schema["minLength"]:
                out.append((_pointer(path), f"text shorter than {schema['minLength']} characters"))
            if "maxLength" in schema and len(value) > schema["maxLength"]:
                out.append((_pointer(path), f"text longer than {schema['maxLength']} characters ({len(value)})"))
            if "pattern" in schema and not re.search(schema["pattern"], value):
                out.append((_pointer(path), f"{value!r} does not match {schema['pattern']}"))

        if _is_type(value, "number"):
            if "minimum" in schema and value < schema["minimum"]:
                out.append((_pointer(path), f"{value} is below minimum {schema['minimum']}"))
            if "maximum" in schema and value > schema["maximum"]:
                out.append((_pointer(path), f"{value} is above maximum {schema['maximum']}"))

        if isinstance(value, list):
            if "minItems" in schema and len(value) < schema["minItems"]:
                out.append((_pointer(path), f"needs at least {schema['minItems']} items"))
            if "maxItems" in schema and len(value) > schema["maxItems"]:
                out.append((_pointer(path), f"allows at most {schema['maxItems']} items ({len(value)})"))
            if "items" in schema:
                for i, item in enumerate(value):
                    self._validate(item, schema["items"], path + [i], out)

        if isinstance(value, dict):
            for key in schema.get("required", []):
                if key not in value:
                    out.append((_pointer(path), f"missing required property '{key}'"))
            props = schema.get("properties", {})
            for key, sub in props.items():
                if key in value:
                    self._validate(value[key], sub, path + [key], out)
            if schema.get("additionalProperties") is False:
                for key in value:
                    if key not in props:
                        out.append((_pointer(path), f"unknown property '{key}'"))

        for sub in schema.get("allOf", []):
            self._validate(value, sub, path, out)

        if "if" in schema:
            probe = []
            self._validate(value, schema["if"], path, probe)
            if not probe and "then" in schema:
                self._validate(value, schema["then"], path, out)
