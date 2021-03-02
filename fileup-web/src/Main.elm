module Main exposing (..)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode exposing (Decoder, int, string, bool, field, map2, map3, map4)
import Http
import File as F
import File.Select as Select
import Config exposing (..)
-- MAIN
main : Program () Model Msg
main =
  Browser.element
    { init = init
    , update = update
    , subscriptions = always Sub.none
    , view = view
    }


type alias File =
  { id: String,
    filename : String,
    size: Int,
    date: String
  }

type alias Files = List File
-- MODEL

type alias Stat =
    { msg : String,
      error : Bool,
      code : Int
    }

type alias ResponseResult = (Stat, Files)

type ModelState
  = Failure String
  | Initializing 
  | Loading
  | Success ResponseResult

type alias Model =
    { server : String
    , state : ModelState
    }

init : () -> (Model, Cmd Msg)
init _ = ({server="", state=Initializing}, Cmd.none)

-- UPDATE
type Msg
  = ResetRequested
  | TextChangeRequested String
  | ListRequested
  | Listed (Result Http.Error ResponseResult)
  | DeleteRequested String
  | Deleted (Result Http.Error ResponseResult)
  | UploadRequest
  | FileSelected F.File
  | Uploaded (Result Http.Error ResponseResult)


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    ResetRequested ->
      ({server="", state=Initializing}, Cmd.none)
    TextChangeRequested serveraddr ->
      ({server=serveraddr, state=model.state}, Cmd.none)
    ListRequested ->
      ({server=model.server, state=Loading}, listFile model.server)
    UploadRequest ->
      (model, Select.file [] FileSelected)
    FileSelected  file->
      (model, uploadFile model.server file)
    Listed result ->
      case result of
        Ok (stat, files) ->
          if stat.error then ({server=model.server, state=Failure stat.msg}, Cmd.none) 
          else ({server=model.server, state= Success (stat, files)}, Cmd.none)
        Err err ->
          case err of 
            Http.BadUrl url ->
              ({server=model.server, state=Failure url}, Cmd.none)
            Http.Timeout ->
              ({server=model.server, state=Failure "Request Timeout"}, Cmd.none)
            Http.NetworkError ->
              ({server=model.server, state=Failure "Network Error"}, Cmd.none)
            Http.BadStatus code ->
              ({server=model.server, state=Failure ("Bad Status" ++ String.fromInt code)}, Cmd.none)
            Http.BadBody body ->
              ({server=model.server, state=Failure body}, Cmd.none)
    DeleteRequested id ->
          (model, deleteFile model.server id)
    Deleted result ->
      case result of
        Ok (stat, _) ->
          if stat.error then ({server=model.server, state=Failure stat.msg}, Cmd.none) 
          else (model, listFile model.server)
        Err err ->
          case err of 
            Http.BadUrl url ->
              ({server=model.server, state=Failure url}, Cmd.none)
            Http.Timeout ->
              ({server=model.server, state=Failure "Request Timeout"}, Cmd.none)
            Http.NetworkError ->
              ({server=model.server, state=Failure "Network Error"}, Cmd.none)
            Http.BadStatus code ->
              ({server=model.server, state=Failure ("Bad Status" ++ String.fromInt code)}, Cmd.none)
            Http.BadBody body ->
              ({server=model.server, state=Failure body}, Cmd.none)
    Uploaded result ->
      case result of
        Ok (stat, _) ->
          if stat.error 
          then ({server=model.server, state=Failure stat.msg}, Cmd.none) 
          else ({server=model.server, state=Loading}, listFile model.server)
        Err err ->
          case err of 
            Http.BadUrl url ->
              ({server=model.server, state=Failure url}, Cmd.none)
            Http.Timeout ->
              ({server=model.server, state=Failure "Request Timeout"}, Cmd.none)
            Http.NetworkError ->
              ({server=model.server, state=Failure "Network Error"}, Cmd.none)
            Http.BadStatus code ->
              ({server=model.server, state=Failure ("Bad Status" ++ String.fromInt code)}, Cmd.none)
            Http.BadBody _ ->
              ({server=model.server, state=Failure "Bad body"}, Cmd.none)

-- VIEW
view : Model -> Html Msg
view model =
  div []
    [h2 [] [ text "File Uploader - Web" ]
    , if model.state == Initializing 
      then div [] 
      [ label [] [text "Server Address: "]
      , input [ placeholder "127.0.0.1:54321",value model.server, onInput TextChangeRequested] []
      , button [type_ "button", onClick (ListRequested)] [ text "Connect"]
      ]
      else viewControls model
    ]

viewControls : Model -> Html Msg
viewControls model =
 case model.state of
    Initializing ->
      div [] []
    Failure msg ->
      div [] 
      [ label [] [text (msg ++ " on server "++ model.server)]
      , button [type_ "button", onClick (ResetRequested)] [ text "Reset"]
      ]
    Loading ->
      div [] [text "Loading ..."]
    Success (_, files) -> 
      div [] 
        [ h3 [] [text "Upload"]
        , button [ onClick UploadRequest] [text "Upload..."]
        , h3 [] [ text "Files" ]
        , div [] [button [type_ "button", onClick (ListRequested)] [ text "Refresh files"]]
        , br [] []
        , viewFiles files
        , label [] [text ("On server http://"++ model.server)
        , button [type_ "button", onClick (ResetRequested)] [ text "Reset"]]
        ]

viewFiles : Files -> Html Msg
viewFiles files = div [] [ table [] (viewTableHeader:: List.map viewFile files)]


viewTableHeader : Html Msg
viewTableHeader =
    tr []
        [ th []
            [ text "Name" ]
        , th []
            [text "Size"]
        , th []
            [ text "Uploaded Date (on Server)" ]
        ]

viewFile : File -> Html Msg
viewFile file =
    tr []
        [ td []
            [ text file.filename ]
        , td []
            [text (String.fromInt file.size)]
        , td []
            [ text file.date ]
        , td []
            [
               button [ type_ "button", onClick (DeleteRequested file.id) ]
                [ text "Delete" ]
            ]
        ]

-- HTTP
deleteFile : String -> String -> Cmd Msg
deleteFile server id =
    Http.request
        { method = "GET"
        , headers = []
        , url = "http://" ++ server ++ "/delete?uuid=" ++ id
        , body = Http.emptyBody
        , expect = Http.expectJson Deleted resultDecoder
        , timeout = Nothing
        , tracker = Nothing
        }

listFile : String -> Cmd Msg
listFile server =
  Http.get
    { url = "http://" ++ server ++ "/list?detailed=true"
    , expect = Http.expectJson Listed resultDecoder
    }


uploadFile : String -> F.File -> Cmd Msg
uploadFile server file =
  Http.post
  { url = "http://" ++ server++ "/upload"
  , body = Http.multipartBody [Http.filePart "file" file]
  , expect =  Http.expectJson Uploaded resultDecoder
  }


statDecoder: Decoder Stat
statDecoder = 
  map3 Stat
    (field "msg" string)
    (field "error" bool)
    (field "status" int)

fileDecoder: Decoder File
fileDecoder =
  map4 File
    (field "id" string)
    (field "filename" string)
    (field "size" int)
    (field "uploaddate" string)


resultDecoder : Decoder ResponseResult
resultDecoder = 
  map2 Tuple.pair
  (field "meta" statDecoder)
  (field "data" (Json.Decode.list fileDecoder))
