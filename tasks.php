<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Task.php';

$database = new Database();
$db = $database->getConnection();

$task = new Task($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['user_id'])) {
            $task->user_id = $_GET['user_id'];
            $stmt = $task->readByUser();
            $num = $stmt->rowCount();

            $tasks_arr = array();
            $tasks_arr["tasks"] = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $task_item = array(
                    "id" => $id,
                    "title" => $title,
                    "description" => $description,
                    "completed" => (bool)$completed,
                    "due_date" => $due_date,
                    "priority" => $priority,
                    "created_at" => $created_at
                );
                array_push($tasks_arr["tasks"], $task_item);
            }

            http_response_code(200);
            echo json_encode($tasks_arr);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->user_id) && !empty($data->title)) {
            $task->user_id = $data->user_id;
            $task->title = $data->title;
            $task->description = $data->description ?? '';
            $task->due_date = $data->due_date ?? null;
            $task->priority = $data->priority ?? 'medium';

            if($task->create()) {
                http_response_code(201);
                echo json_encode(array("message" => "Tarefa criada com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível criar a tarefa."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->id) && !empty($data->user_id)) {
            $task->id = $data->id;
            $task->user_id = $data->user_id;
            $task->title = $data->title ?? '';
            $task->description = $data->description ?? '';
            $task->completed = $data->completed ?? false;
            $task->due_date = $data->due_date ?? null;
            $task->priority = $data->priority ?? 'medium';

            if($task->update()) {
                http_response_code(200);
                echo json_encode(array("message" => "Tarefa atualizada com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível atualizar a tarefa."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->id) && !empty($data->user_id)) {
            $task->id = $data->id;
            $task->user_id = $data->user_id;

            if($task->delete()) {
                http_response_code(200);
                echo json_encode(array("message" => "Tarefa excluída com sucesso."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Não foi possível excluir a tarefa."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Dados incompletos."));
        }
        break;
}
?>