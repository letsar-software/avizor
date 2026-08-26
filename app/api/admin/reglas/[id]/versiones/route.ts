import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { parseAdminId } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { nextVersion } from "@/lib/rules/versioning";

// Fork de una regla (RN-004): crea una nueva fila 'experimental' a partir de
// cualquier estado de origen, copiando todas sus columnas (legacy v1 incluidas,
// que siguen NOT NULL) salvo version/estado/validado_por/validado_en, que se
// resetean para la nueva versión.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "reglas", "write");
    const id = parseAdminId((await params).id);

    const origen = await query("select cultivo, clave, version from reglas_agronomicas where id::text=$1", [id]);
    if (!origen.rows[0]) throw new DomainError("REGLA_NO_ENCONTRADA", "Regla no encontrada.", 404);
    const { cultivo, clave } = origen.rows[0];

    let version = nextVersion(origen.rows[0].version);
    for (let intentos = 0; intentos < 50; intentos += 1) {
      const existe = await query("select 1 from reglas_agronomicas where cultivo=$1 and clave=$2 and version=$3", [cultivo, clave, version]);
      if (!existe.rows.length) break;
      version = nextVersion(version);
    }

    const nueva = await query(
      `insert into reglas_agronomicas (
         cultivo, categoria_nombre, condicion, causas, recomendacion, regla_version, estado_regla, prioridad, activa, combinador, condiciones,
         clave, version, estado, ventana_dias, fuente_tecnica, limitaciones_declaradas, validado_por, validado_en, condiciones_revision, decisiones_pendientes, definicion
       )
       select
         cultivo, categoria_nombre, condicion, causas, recomendacion, regla_version, estado_regla, prioridad, true, combinador, condiciones,
         clave, $2, 'experimental', ventana_dias, fuente_tecnica, limitaciones_declaradas, null, null, condiciones_revision, decisiones_pendientes, definicion
       from reglas_agronomicas where id::text = $1
       returning *`,
      [id, version],
    );

    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'crear_version','regla',$3,null,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, nueva.rows[0].id, JSON.stringify(nueva.rows[0]), rid],
    );

    return success(nueva.rows[0], rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
