import json
import sys

data_path = sys.argv[1] if len(sys.argv) > 1 else "dashboard_data.json"
out_path = sys.argv[2] if len(sys.argv) > 2 else "dashboard.html"

with open("template.html", encoding="utf-8") as f:
    template = f.read()

with open(data_path, encoding="utf-8") as f:
    data = json.load(f)

data_json = json.dumps(data, ensure_ascii=False).replace("</script>", "<\\/script>")
html = template.replace("__DATA_JSON__", data_json)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Wrote", out_path)
