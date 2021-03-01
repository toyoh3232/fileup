module Main exposing (..)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode exposing (Decoder, int, string, bool, field, map2, map3, map4)
import Http exposing (fileBody)
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

type Model
  = Failure Http.Error
  | Loading
  | Success ResponseResult

init : () -> (Model, Cmd Msg)
init _ = (Loading, listFile)

-- UPDATE
type Msg
  = ListRequested
  | Listed (Result Http.Error ResponseResult)
  | DeleteRequested String
  | Deleted (Result Http.Error ResponseResult)
  | UploadRequest
  | FileSelected F.File
  | Uploaded (Result Http.Error ResponseResult)


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    ListRequested ->
      (Loading, listFile)
    UploadRequest ->
      (model, Select.file [] FileSelected)
    FileSelected  file->
      (model, uploadFile file)
    Listed result ->
      case result of
        Ok fileResult ->
          (Success fileResult, Cmd.none)
        Err err ->
          (Failure err, Cmd.none)
    DeleteRequested id ->
          (model, deleteFile id)
    Deleted result ->
      case result of
        Ok _ ->
          (model, listFile)
        Err err ->
          (Failure err, Cmd.none)
    Uploaded result ->
      case result of
        Ok _ ->
          (model, listFile)
        Err err ->
          (Failure err, Cmd.none)

-- VIEW
view : Model -> Html Msg
view model =
  div []
    [h2 [] [ text "File Uploader - Web" ]
    , h3 [] [text "Upload"]
    ,button [ onClick UploadRequest] [text "Upload..."]
    , viewFiles model

    ]

viewFiles : Model -> Html Msg
viewFiles model =
  case model of
    Failure _ ->
      div [] [text "error"]
    Loading ->
      div []
        [text "Loading..."]

    Success (_, files) ->
        div []
           [ h3 [] [ text "Files" ]
           , div [] [button [type_ "button", onClick (ListRequested)] [ text "Refresh files"]]
           , div [] 
             [
               table [] (viewTableHeader:: List.map viewFile files)
             ]
           ]

viewTableHeader : Html Msg
viewTableHeader =
    tr []
        [ th []
            [ text "Name" ]
        , th []
            [text "Size"]
        , th []
            [ text "Uploaded Date" ]
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
deleteFile : String -> Cmd Msg
deleteFile id =
    Http.request
        { method = "GET"
        , headers = []
        , url = Config.endpoint ++ "delete?uuid=" ++ id
        , body = Http.emptyBody
        , expect = Http.expectJson Deleted resultDecoder
        , timeout = Nothing
        , tracker = Nothing
        }

listFile : Cmd Msg
listFile =
  Http.get
    { url = Config.endpoint ++ "list?detailed=true"
    , expect = Http.expectJson Listed resultDecoder
    }


uploadFile : F.File -> Cmd Msg
uploadFile file =
  Http.post
  { url = Config.endpoint ++ "upload"
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
